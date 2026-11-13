// `astro check` only logs an error and exits 0 when @astrojs/check or typescript fails to load, so a
// broken install would pass the check without checking anything. Loading them here fails loudly.
import '@astrojs/check';
import 'typescript';
