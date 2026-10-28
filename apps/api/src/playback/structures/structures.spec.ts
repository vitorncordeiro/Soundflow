import { FifoQueue } from './fifo-queue';
import { LifoStack } from './lifo-stack';

describe('FifoQueue', () => {
  it('sai na ordem de entrada (FIFO)', () => {
    const q = new FifoQueue<number>();
    [1, 2, 3].forEach((n) => q.enqueue(n));
    expect([q.dequeue(), q.dequeue(), q.dequeue()]).toEqual([1, 2, 3]);
  });

  it('normaliza null da biblioteca para undefined em fila vazia', () => {
    const q = new FifoQueue<number>();
    expect(q.dequeue()).toBeUndefined();
    expect(q.peek()).toBeUndefined();
    expect(q.isEmpty()).toBe(true);
    expect(q.size).toBe(0);
  });

  it('peek nao remove', () => {
    const q = new FifoQueue<string>();
    q.enqueue('a');
    q.enqueue('b');
    expect(q.peek()).toBe('a');
    expect(q.size).toBe(2);
  });

  it('toArray devolve copia na ordem de saida', () => {
    const q = new FifoQueue<number>();
    q.enqueue(1);
    q.enqueue(2);
    const copy = q.toArray();
    copy.push(99);
    expect(q.toArray()).toEqual([1, 2]);
  });

  it('removeWhere remove so o primeiro correspondente e preserva a ordem', () => {
    const q = new FifoQueue<{ id: string }>();
    ['a', 'b', 'a', 'c'].forEach((id) => q.enqueue({ id }));
    expect(q.removeWhere((x) => x.id === 'a')).toEqual({ id: 'a' });
    expect(q.toArray().map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(q.removeWhere((x) => x.id === 'zzz')).toBeUndefined();
  });

  it('removeAll remove todos os correspondentes', () => {
    const q = new FifoQueue<number>();
    [1, 2, 1, 3].forEach((n) => q.enqueue(n));
    expect(q.removeAll((n) => n === 1)).toBe(2);
    expect(q.toArray()).toEqual([2, 3]);
    expect(q.removeAll((n) => n === 9)).toBe(0);
  });

  it('clear esvazia e a fila continua utilizavel', () => {
    const q = new FifoQueue<number>();
    q.enqueue(1);
    q.clear();
    expect(q.isEmpty()).toBe(true);
    q.enqueue(2);
    expect(q.dequeue()).toBe(2);
  });
});

describe('LifoStack', () => {
  it('sai na ordem inversa (LIFO)', () => {
    const s = new LifoStack<number>();
    [1, 2, 3].forEach((n) => s.push(n));
    expect([s.pop(), s.pop(), s.pop()]).toEqual([3, 2, 1]);
  });

  it('normaliza null da biblioteca para undefined em pilha vazia', () => {
    const s = new LifoStack<number>();
    expect(s.pop()).toBeUndefined();
    expect(s.peek()).toBeUndefined();
    expect(s.isEmpty()).toBe(true);
  });

  it('toArray lista do mais recente para o mais antigo', () => {
    const s = new LifoStack<string>();
    ['a', 'b', 'c'].forEach((x) => s.push(x));
    expect(s.toArray()).toEqual(['c', 'b', 'a']);
    expect(s.peek()).toBe('c');
    expect(s.size).toBe(3);
  });

  it('clear esvazia', () => {
    const s = new LifoStack<number>();
    s.push(1);
    s.clear();
    expect(s.size).toBe(0);
  });
});
