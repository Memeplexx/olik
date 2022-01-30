import { createStore } from './core';

type Test = { num: number, arr: Array<number>, objArr: Array<{ num: number }>, obj: { num: number } };

interface State {
  number: number,
  string: string,
  array: number[],
  arrayStr: string[],
  arrayBool: boolean[],
  arrayTuple: ('hello' | 'world')[],
  objArray: Test[],
  object: { one: string, two: string, three: number, a: {b: {c: {d: string}}} }
}

function test() {
  const store = createStore<State>({
    name: 'My Store',
    state: {
      number: 0,
      string: '',
      array: new Array<number>(),
      arrayStr: new Array<string>(),
      arrayBool: new Array<boolean>(),
      arrayTuple: new Array<'hello' | 'world'>(),
      objArray: new Array<Test>(),
      object: { one: '', two: '', three: 0 } as any
    }
  });

  store.objArray
    .$find.obj.num.$eq(3)
    .$remove();

  store.string
    .$replace('test');

  store.array
    .$find.$eq(0)
    .$replace(0);

  store.objArray
    .$find.$eq({ num: 0, arr: [], objArr: [], obj: { num: 0 } })
    .num.$replace(3)

  store.objArray
    .$find.num.$eq(0)
    .$replace({ num: 2, arr: [], objArr: [], obj: { num: 0 } });

  store.objArray
    .$find.num.$eq(0)
    .num.$replace(3);

  store.objArray
    .$find.arr.$eq([])
    .$replace({ num: 3, arr: [], objArr: [], obj: { num: 0 } });

  store.objArray
    .$find.num.$eq(3)
    .arr.$find.$eq(0)
    .$replace(0);

  store.objArray
    .$find.num.$eq(3)
    .objArr.$find.$eq({ num: 3 })
    .$replace({ num: 2 });

  store.objArray
    .$find.num.$eq(3)
    .objArr.$find.num.$eq(3)
    .$replace({ num: 2 });

  store.object
    .$patch({ two: 'd' });

  store.array
    .$find.$in([0])
    .$replace(0);

  store.objArray
    .$find.$in([{ arr: [], num: 0, objArr: [], obj: { num: 0 } }])
    .$replace({ arr: [], num: 0, objArr: [], obj: { num: 0 } });


  store.objArray
    .$find.num.$eq(3).$or.arr.$eq([])
    .$remove();

  store.objArray
    .num.$replace(2);

  store.objArray
    .$find.num.$eq(3)
    .num.$replace(3)

  store.arrayTuple
    .$find.$in(['hello']).$and.$eq('world')
    .$replace('world');

  store.array
    .$find.$eq(3)
    .$add(3);

  store.number.$add(3);

  const rr = store.array
    .$state;

  const r = store.objArray
    .$filter.$eq(null as any)
    .$state;

  const rrr = store.array
    .$filter.$eq(2)
    .$state;

  const rrrr = store.$state;

  const abc = store.objArray
    .$find.num.$eq(3)
    .objArr.$find.num.$eq(3)
    .$state;

  const e = store.array
    .$find.$eq(3).$and.$lt(5)
    .$state;

  store.objArray
    .$upsertMatching.obj.num
    .$withOne({ num: 3, arr: [], objArr: [], obj: { num: 0 } });

  store.objArray
    .$upsertMatching.obj.num
    .$withMany([{ num: 3, arr: [], objArr: [], obj: { num: 0 } }]);

  store.objArray
    .objArr.$find.num.$eq(3)
    .$patch({ num: 4 });

}

export const demo = () => {
  const store = createStore({
    name: 'my store',
    state: {
      user: { name: '', age: 0 },
      todos: new Array<{ id: number, title: string, status: 'done' | 'todo' }>(),
    }
  });

  store.user.age
    .$add(1);
  // { type: 'user.age.increment()', payload: 1 }

  store.todos
    .$find.id.$eq(3).status
    .$replace('todo');
  // { type: 'todos.find.id.eq(3).status.replace()', payload: 'todo' }

  store.todos
    .$filter.status.$eq('done')
    .$remove();
  // { type: 'todos.filter.status.eq(done).replace()' }

  store.user.name.$replace('test');
  // { type: 'user.name.replace()', payload: 'test' }

  // store.todos.status.$replace
  // store.user.name.
  store.todos.$filter.id.$eq(3).status.$replace('done');
  store.todos.$find.id.$eq(3).status.$replace

  store.todos.$filter.id.$eq(3).id.$add(1);
  store.todos.$find.id.$eq(3).id.$add(1);

  store.user.age.$replace(3);
  store.user.name.$replace('ss');

}

export const demo2 = () => {
  const store = createStore({
    name: '??',
    state: {
      arr: [
        { id: 1, obj: { id: 1, str: '', num: 0 } }
      ]
    }
  });
  store.arr.$filter.id.$eq(3).obj.$replace;
  store.arr.$find.id.$eq(3).obj.$replace;
}

export const demo3 = () => {
  const store = createStore({
    name: '???',
    state: [{ id: 1, val: '' }]
  });
  store.$find.id.$eq(3).$replace
  store.$filter.id.$eq(3).$replace
}
