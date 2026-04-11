export default class ExtendedMap<K extends Object, V> {
  private readonly map = new Map<string, V>();

  constructor(private defaultValueFunction: (key: K) => V) {}

  get(key: K): V {
    if (!this.map.has(key.toString())) {
      this.map.set(key.toString(), this.defaultValueFunction(key));
    }
    return this.map.get(key.toString())!;
  }

  has(key: K): boolean {
    return this.map.has(key.toString());
  }

  set(key: K, value: V): this {
    this.map.set(key.toString(), value);
    return this;
  }

  clear(): void {
    this.map.clear();
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }

  entries():IterableIterator<[string, V]>{
    return this.map.entries();
  }

  
  filter(predicate: (key: string, value: V) => boolean): ExtendedMap<K, V> {
    const result = new ExtendedMap<K, V>(this.defaultValueFunction);
    

    for (const [key, value] of this.map.entries()) {
      if (predicate(key, value)) {
        result.map.set(key, value);
      }
    }

    return result;
  }
  
}

/**
 * This code is based on work by Mohammad Baqer
 * Source: https://github.com/mtbaqer/vscode-better-folding
 * Licensed under the MIT License
 * License: https://marketplace.visualstudio.com/items/MohammadBaqer.better-folding/license
 */

