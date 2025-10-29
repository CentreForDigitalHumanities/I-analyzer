/* eslint-disable @typescript-eslint/member-ordering */
import { Directive, EventEmitter, HostBinding, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';

import * as _ from 'lodash';

import {
    ApiService,
    NotificationService,
    SearchService,
} from '@services/index';
import { Chart, ChartOptions } from 'chart.js';
import {
    FreqTableHeaders,
    QueryModel,
    CorpusField,
    ChartParameters,
} from '@models';
import Zoom from 'chartjs-plugin-zoom';
import { Subject, takeUntil } from 'rxjs';
import { selectColor } from '@utils/select-color';
import { VisualizationService } from '@services/visualization.service';
import { ComparedQueries } from '@models/compared-queries';
import { RouterStoreService } from '../../store/router-store.service';
import { hasPrefixTerm } from './query-utils';
import { BarchartData } from './results-count';

const hintSeenSessionStorageKey = 'hasSeenTimelineZoomingHint';
const hintHidingMinDelay = 500;       // milliseconds
const hintHidingDebounceTime = 1000;  // milliseconds
const barchartID = 'barchart';
const documentLimitBase = 10000;
const documentLimitPrefixQueries = 1000;


@Directive({
    selector: 'ia-barchart',
    standalone: false
})
/** The barchartComponent is used to define shared functionality between the
 * histogram and timeline components. It does not function as a stand-alone component. */
export abstract class BarchartDirective<
    Data extends BarchartData<any, any>
> implements OnChanges, OnInit, OnDestroy {
    @HostBinding('style.display') display = 'block'; // needed for loading spinner positioning

    public showHint: boolean;

    // chart object
    chart: Chart;

    @Input() queryModel: QueryModel;
    @Input() visualizedField: CorpusField;
    @Input() asTable: boolean;
    @Input() palette: string[];

    @Input() frequencyMeasure: 'documents' | 'tokens' = 'documents';

    normalizer: 'raw' | 'percent' | 'documents' | 'terms' = 'raw';
    chartType: 'bar' | 'line' | 'scatter' = 'bar';
    comparedQueries: ComparedQueries;

    // documentLimitExceeded = false; // whether the results include documents than the limit
    // totalTokenCountAvailable: boolean; // whether the data includes token count totals

    // table data
    tableHeaders: FreqTableHeaders;
    tableData: any[];


    /** Stores the key that can be used in a DataPoint object
     * to retrieve the y-axis value.
     * Key can be retrieved as
     * `valueKeys[frequencyMeasure][normalizer]`
     */
    valueKeys = {
        tokens: {
            raw: 'match_count',
            terms: 'matches_by_token_count',
            documents: 'matches_by_doc_count',
        },
        documents: {
            raw: 'doc_count',
            percent: 'relative_doc_count',
        },
    };

    // eslint-disable-next-line @angular-eslint/no-output-native
    @Output() error = new EventEmitter();

    /** indicates that the data model should be re-instantiated */
    refresh$ = new Subject<void>();

    destroy$ = new Subject<void>();

    data: Data;

    basicChartOptions: ChartOptions = { // chart options not suitable for Chart.defaults.global
        scales: {
            x: {
                title: { display: true },
                border: { display: true },
                grid: { drawOnChartArea: false },
            },
            y: {
                type: 'linear',
                beginAtZero: true,
                title: { display: true, text: 'Frequency' },
                border: { display: true },
                grid: { drawOnChartArea: false },
                ticks: {
                    callback: (value, index, values) =>
                        this.formatValue(this.normalizer)(value as number),
                },
                min: 0,
            },
        },
        interaction: {
            axis: 'x',
        },
        plugins: {
            legend: {
                display: false,
            },
            zoom: {
                zoom: {
                    mode: 'x',
                    drag: {
                        enabled: true,
                        threshold: 0,
                    },
                    pinch: {
                        enabled: false,
                    },
                    wheel: {
                        enabled: false,
                    },
                    onZoom: ({ chart }) => this.onZoomIn(chart),
                },
            },
            title: {
                display: true,
                text: `placeholder`,
                align: 'center',
            },
        },
    };

    constructor(
        public searchService: SearchService,
        public visualizationService: VisualizationService,
        public apiService: ApiService,
        private notificationService: NotificationService,
        private routerStoreService: RouterStoreService,
    ) {
        const chartDefault = Chart.defaults;
        chartDefault.elements.bar.backgroundColor = selectColor();
        chartDefault.elements.bar.hoverBackgroundColor = selectColor();
        chartDefault.plugins.tooltip.displayColors = false;
        chartDefault.plugins.tooltip.intersect = false;
        this.comparedQueries = new ComparedQueries(this.routerStoreService);
    }

    get isLoading() {
        return this.data.loading$.value;
    }

    get documentLimit(): number {
        return hasPrefixTerm(this.queryModel.queryText) ? documentLimitPrefixQueries : documentLimitBase;
    }

    ngOnInit(): void {
        this.setupZoomHint();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.changesRequireRefresh(changes)) {
            this.refresh$.next();
            this.refreshChart();
        } else if (changes.palette) {
            this.setChart();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next(undefined);
        this.refresh$.complete();
        this.destroy$.complete();
        this.comparedQueries.complete();
    }

    onDataLoaded(data: typeof this.data.rawData$.value) {
        // initialise or update chart
        this.setChart();

        // update freqtable
        this.setTableHeaders();
        this.setTableData();

        // load zoomed-in data if needed
        if (this.isZoomedIn) {
            this.onZoomIn(this.chart, true);
        }
    }

    /** check whether input changes should force reloading the data */
    changesRequireRefresh(changes: SimpleChanges): boolean {
        const relevantChanges = [
            changes.corpus,
            changes.queryModel,
            changes.visualizedField,
            changes.frequencyMeasure,
        ].filter((change) => !_.isUndefined(change));

        return _.some(
            relevantChanges,
            (change) => !_.isEqual(change.currentValue, change.previousValue)
        );
    }

    /** update graph after changes to the chart settings (i.e. normalizer and chart type) */
    onOptionChange(chartParameters: ChartParameters) {
        this.normalizer = chartParameters.normalizer;
        this.chartType = chartParameters.chartType;
        if (this.data.rawData$.value && this.chart) {
            this.onDataLoaded(this.data.rawData$.value);
        }
    }

    /**
     * clear data and update chart
     */
    refreshChart(): void {
        // complete existing data model
        this.data?.complete();

        // create new data model and subscribe
        this.data = this.initData();
        this.data.rawData$.pipe(
            takeUntil(this.refresh$),
            takeUntil(this.destroy$),
        ).subscribe(data => this.onDataLoaded(data));
        this.data.error$.pipe(
            takeUntil(this.refresh$),
            takeUntil(this.destroy$),
        ).subscribe(message => this.onDataError(message));

        // clear canvas
        this.clearCanvas();
    }

    /** if a chart is active, clear canvas and reset chart object */
    clearCanvas(): void {
        if (this.chart) {
            // clear canvas an reset chart object
            this.chart.destroy();
            this.chart = undefined;
        }
    }

    selectSearchFields(queryModel: QueryModel) {
        if (this.frequencyMeasure === 'documents') {
            return queryModel;
        } else {
            const mainContentFields = this.queryModel.corpus.fields.filter(
                (field) =>
                    field.searchable && field.displayType === 'text_content'
            );
            const queryModelCopy = queryModel.clone();
            queryModelCopy.setParams({searchFields: mainContentFields});
            return queryModelCopy;
        }
    }

    onDataError(message: string) {
        console.error(message);
        this.error.emit(`could not load results: ${message}`);
    }

    requestFullData() {
        this.data.fullDataRequest()
            .then(() =>
                this.notificationService.showMessage(
                    'Full data requested! You will receive an email when your download is ready.',
                    'success',
                    {
                        text: 'view downloads',
                        route: ['/download-history'],
                    }
                )
            )
            .catch((error) => {
                console.error(error);
                this.notificationService.showMessage(
                    'Could not set up data generation.',
                    'danger'
                );
            });
    }

    /** update or initialise chart (should be ran after updates to `rawData`) */
    setChart(): void {
        if (this.chart) {
            this.updateChartData();
        } else {
            this.initChart();
        }
    }
    /** select the columns/headers for the frequency table */
    abstract setTableHeaders(): void;
    /** code to be executed when zooming in, or when parameters are updated while zoomed in */
    onZoomIn(chart, triggeredByDataUpdate = false) {}
    /** options for the chart.
     *
     * @param datasets array of dataset objects for the chart
     */
    abstract chartOptions(datasets);

    /** initalise a new chart */
    initChart() {
        const labels = this.getLabels();
        const datasets = this.getDatasets();
        const options = this.chartOptions(datasets);

        this.chart = new Chart(barchartID, {
            type: 'bar',
            data: {
                labels,
                datasets,
            },
            plugins: [Zoom],
            options,
        });

        this.chart.canvas.ondblclick = (event) => this.zoomOut();
    }

    /** reset zooming */
    zoomOut(): void {
        this.chart.resetZoom();
    }

    /** After updating `rawData`, this executes the update in the chart. */
    updateChartData() {
        const labels = this.getLabels();
        const datasets = this.getDatasets();
        this.chart.options = this.chartOptions(datasets);
        this.chart.data.labels = labels;
        this.chart.data.datasets = datasets;
        this.chart.options.plugins.legend.display = datasets.length > 1;
        this.chart.update();
    }

    /** Return x-axis labels for the chartJS dataset.
     * Can be left undefined depending on data format.
     */
    getLabels(): string[] {
        return undefined;
    }

    /** return chartJS dataset objects based on rawData */
    abstract getDatasets(): any[];

    /**
     * Show the zooming hint once per session, hide automatically with a delay
     * when the user moves the mouse.
     */
    setupZoomHint() {
        if (!sessionStorage.getItem(hintSeenSessionStorageKey)) {
            sessionStorage.setItem(hintSeenSessionStorageKey, 'true');
            this.showHint = true;
            const hider = _.debounce(() => {
                this.showHint = false;
                document.body.removeEventListener('mousemove', hider);
            }, hintHidingDebounceTime);
            _.delay(() => {
                document.body.addEventListener('mousemove', hider);
            }, hintHidingMinDelay);
        }
    }

    formatValue(normalizer: string): (value?: number) => string | undefined {
        if (normalizer === 'percent') {
            return (value?: number) => {
                if (value !== undefined && value !== null) {
                    return `${_.round(100 * value, 1)}%`;
                }
            };
        } else if (normalizer === 'documents' || normalizer === 'terms') {
            return (value: number) => {
                if (value !== undefined && value !== null) {
                    return value.toPrecision(2);
                }
            };
        } else {
            return (value: number) => {
                if (value !== undefined && value !== null) {
                    return value.toString();
                }
            };
        }
    }

    get formatDownloadValue(): (value: number) => string {
        if (this.normalizer === 'percent') {
            return (value: number) => {
                if (value !== undefined && value !== null) {
                    return `${_.round(100 * value, 1)}`;
                }
            };
        } else {
            return (value: number) => value.toString();
        }
    }

    /** assemble the array of table data */
    setTableData() {
        if (this.data.rawData$.value && this.data.rawData$.value.length) {
            this.tableData = _.flatMap(this.data.rawData$.value, (series) =>
                series.data.map((item) => {
                    const result = _.cloneDeep(item) as any;
                    result.queryText = series.queryText;
                    return result;
                })
            );
        }
    }

    /** which key of a DataPoint object should be used as the y-axis value */
    get currentValueKey(): string {
        return this.valueKeys[this.frequencyMeasure][this.normalizer];
    }

    /**
     * Percentage of documents that was actually read when determining term frequency.
     * This differs per series, but user message only gives one value, currently the minimum.
     */
    get percentageDocumentsSearched() {
        if (this.data.rawData$.value) {
            return _.round(
                100 * _.min(this.data.rawData$.value.map((series) => series.searchRatio)),
                1
            );
        }
    }

    /**
     * Whether the graph is zoomed in on the x-axis.
     */
    get isZoomedIn(): boolean {
        // If no zooming-related scripts are implemented, just return false
        return false;
    }

    get searchFields(): string {
        if (this.queryModel) {
            const searchFields = this.selectSearchFields(
                this.queryModel
            ).searchFields;

            const displayNames = searchFields.map((field) => field.displayName);

            return displayNames.join(', ');
        }

        return 'all fields';
    }

    chartTitle() {
        const queryTexts = this.data.rawData$.value.map((series) => series.queryText);
        if (this.queryText == null && this.data.rawData$.value.length === 1) {
            return `Frequency of documents by ${this.visualizedField.displayName} (n of ${this.frequencyMeasure}, ${this.normalizer})`;
        } else {
            const normalizationText = ['raw', 'percent'].includes(
                this.normalizer
            )
                ? ''
                : `, normalized by ${this.normalizer}`;
            return `Frequency of '${queryTexts.join(', ')}' by ${
                this.visualizedField.displayName
            } (n of ${this.frequencyMeasure}${normalizationText})`;
        }
    }

    get queryText(): string {
        if (this.queryModel) {
            return this.queryModel.queryText;
        }
    }

    abstract initData(): Data;
}
