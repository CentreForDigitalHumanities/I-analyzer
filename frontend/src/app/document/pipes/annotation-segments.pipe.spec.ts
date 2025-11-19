import { AnnotationSegmentsPipe } from './annotation-segments.pipe';

describe('AnnotationSegementsPipe', () => {
    let pipe: AnnotationSegmentsPipe;

    beforeEach(() => {
       pipe = new AnnotationSegmentsPipe();
    });

    it('returns unannotated text as-is', () => {
        const text = 'Deze zomer kenmerkte zich door een gezegenden oogst, en met tevredenheid mocht de landbouwer deelnemen aan de Internationale Tentoonstelling die onlangs te Amsterdam, op uitstekende wijze ingericht, plaats had.';
        expect(pipe.transform(text)).toEqual([{ content: text }]);
    });

    it('extracts annotated segments', () => {
        const text = 'Deze zomer kenmerkte zich door een gezegenden oogst, en met tevredenheid mocht de landbouwer deelnemen aan de [Internationale Tentoonstelling](MISC) die onlangs te [Amsterdam](LOC), op uitstekende wijze ingericht, plaats had.';
        expect(pipe.transform(text)).toEqual([
            {
                content:  'Deze zomer kenmerkte zich door een gezegenden oogst, en met tevredenheid mocht de landbouwer deelnemen aan de ',
            },
            {
                content: 'Internationale Tentoonstelling',
                annotation: 'MISC',
            },
            {
                content: ' die onlangs te ',
            },
            {
                content: 'Amsterdam',
                annotation: 'LOC',
            },
            {
                content: ', op uitstekende wijze ingericht, plaats had.',
            }
        ]);
    });
});
