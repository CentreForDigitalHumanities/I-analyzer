# Dropdown component

Typical usage looks like this:

```html
<label id="lucky-number-id">Lucky number</label>
<ia-dropdown (onChange)="selection = $event" labelledBy="lucky-number-id">
    <span iaDropdownLabel>{{selection}}</span>
    <div iaDropdownMenu>
        <a iaDropdownItem [value]="3">
            3
        </a>
        <a iaDropdownItem [value]="5">
            5
        </a>
    </div>
</ia-dropdown>
```

# Template

You can insert other content into the dropdown menu:

```html
<label id="lucky-number-id">Lucky number</label>
<ia-dropdown (onChange)="value = $event" labelledBy="lucky-number-id">
    <span iaDropdownLabel>{{value}}</span>
    <div iaDropdownMenu>
        <a iaDropdownItem [value]="3">
            3
        </a>
        <hr class="dropdown-divider">
        <div class="dropdown-item">
            This explanation can't be selected!
        </div>
        <a iaDropdownItem [value]="5">
            5
        </a>
    </div>
</ia-dropdown>
```

See the [bulma dropdown documentation](https://bulma.io/documentation/components/dropdown/) for documentation on available CSS classes.

## API

Dropdown items support:

- `[value]` input: the value that the item represents.
- `(onSelect)` output: emits the _value_ of the item when it is selected through user interaction (e.g. by clicking it).

The dropdown component supports:

- `[value]` input: this sets the selected value in the menu - use this to set the value from the parent component.
- `[disabled]` input: if `true`, this disables the entire menu.
- `[labelledBy]` input: sets the ID of the element labelling the dropdown. This is required to make the dropdown accessible.
- `(onChanges)` output: emits all changes to the selected value, including when it is set through input. If you only want to listen to UI events, use `(onSelect)` on the individual items instead.

