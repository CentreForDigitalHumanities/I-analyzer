# Dropdown component

Typical usage looks like this:

```html
<ia-dropdown (onChange)="selection = $event">
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
<ia-dropdown (onChange)="value = $event">
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
- `(selected)` output: emits the _value_ of the item when it is selected through user interaction (e.g. by clicking it).

The dropdown component supports:

- `[value]` input: this sets the selected value in the menu - use this to set the value from the parent component.
- `[disabled]` input: if `true`, this disables the entire menu.
- `(onChanges)` output: emits all changes to the selected value, including when it is set through input. If you only want to listen to UI events, use `(selected)` on the individual items instead.

