import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'slugify',
    standalone: false
})
export class SlugifyPipe implements PipeTransform {
    // via: https://gist.github.com/djabif/b8d21c4ebcef51db7a4a28ecf3d41846
    transform(input: string | number): string {
        return input
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[^\w\-]+/g, '') // Remove all non-word chars
            .replace(/\-\-+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start of text
            .replace(/-+$/, ''); // Trim - from end of text
    }
}
