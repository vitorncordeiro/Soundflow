import { Queue } from 'datastructures-js';

/**
 * Adaptador fino sobre a `Queue` do datastructures-js (FIFO).
 *
 * Diferencas da biblioteca que o adaptador normaliza:
 * - `dequeue()` e `front()` devolvem `null` em fila vazia; aqui viram `undefined`.
 * - A biblioteca nao tem `peek`; usamos `front()`.
 * - Nao ha remocao de item especifico; reconstruimos a fila com a API publica.
 * A estrutura em si nao e reimplementada.
 */
export class FifoQueue<T> {
  private readonly items = new Queue<T>();

  get size(): number {
    return this.items.size();
  }

  isEmpty(): boolean {
    return this.items.isEmpty();
  }

  /** Adiciona ao fim da fila. */
  enqueue(item: T): void {
    this.items.enqueue(item);
  }

  /** Remove e devolve o primeiro item, ou `undefined` se a fila estiver vazia. */
  dequeue(): T | undefined {
    const value = this.items.dequeue();
    return value === null ? undefined : value;
  }

  /** Consulta o primeiro item sem remove-lo. */
  peek(): T | undefined {
    const value = this.items.front();
    return value === null ? undefined : value;
  }

  /** Copia dos itens na ordem de saida. Alterar o array nao afeta a fila. */
  toArray(): T[] {
    return [...this.items.toArray()];
  }

  clear(): void {
    this.items.clear();
  }

  /** Remove o primeiro item que satisfaz o predicado, preservando a ordem dos demais. */
  removeWhere(predicate: (item: T) => boolean): T | undefined {
    const all = this.items.toArray();
    const index = all.findIndex(predicate);
    if (index === -1) return undefined;
    const [removed] = all.splice(index, 1);
    this.items.clear();
    all.forEach((item) => this.items.enqueue(item));
    return removed;
  }

  /** Remove todos os itens que satisfazem o predicado. Devolve quantos foram removidos. */
  removeAll(predicate: (item: T) => boolean): number {
    const all = this.items.toArray();
    const kept = all.filter((item) => !predicate(item));
    if (kept.length === all.length) return 0;
    this.items.clear();
    kept.forEach((item) => this.items.enqueue(item));
    return all.length - kept.length;
  }
}
