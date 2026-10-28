import { Stack } from 'datastructures-js';

/**
 * Adaptador fino sobre a `Stack` do datastructures-js (LIFO).
 *
 * Diferencas da biblioteca que o adaptador normaliza:
 * - `pop()` e `peek()` devolvem `null` em pilha vazia; aqui viram `undefined`.
 * - `Stack.toArray()` lista do mais antigo para o mais recente; `toArray()` aqui
 *   devolve do mais recente para o mais antigo, como o historico precisa.
 */
export class LifoStack<T> {
  private readonly items = new Stack<T>();

  get size(): number {
    return this.items.size();
  }

  isEmpty(): boolean {
    return this.items.isEmpty();
  }

  /** Coloca um item no topo. */
  push(item: T): void {
    this.items.push(item);
  }

  /** Remove e devolve o item do topo, ou `undefined` se a pilha estiver vazia. */
  pop(): T | undefined {
    const value = this.items.pop();
    return value === null ? undefined : value;
  }

  /** Consulta o topo sem remove-lo. */
  peek(): T | undefined {
    const value = this.items.peek();
    return value === null ? undefined : value;
  }

  /** Copia dos itens, do mais recente para o mais antigo. */
  toArray(): T[] {
    return [...this.items.toArray()].reverse();
  }

  clear(): void {
    this.items.clear();
  }
}
