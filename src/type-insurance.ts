import { createStore } from './core';


type Test = { num: number, arr: Array<number>, objArr: Array<{ num: number }>, obj: { num: number } };

type Statee = {
  number: number,
  string: string,
  array: number[],
  arrayStr: string[],
  arrayBool: boolean[],
  arrayTuple: ('hello' | 'world')[],
  objArray: Test[],
  object: { one: string, two: string, three: number, a: { b: { c: { d: string } } } }
}

const store0 = createStore<Statee>({
  number: 0,
  string: '',
  array: new Array<number>(),
  arrayStr: new Array<string>(),
  arrayBool: new Array<boolean>(),
  arrayTuple: new Array<'hello' | 'world'>(),
  objArray: new Array<Test>(),
  object: { one: '', two: '', three: 0, a: { b: { c: { d: '' } } } }
});

store0.objArray
  .$find.obj.num.$eq(3)
  .$delete();

store0.string
  .$set('test');

store0.array
  .$find.$eq(0)
  .$set(0);

store0.objArray
  .$find.$eq({ num: 0, arr: [], objArr: [], obj: { num: 0 } })
  .num.$set(3)

store0.objArray
  .$find.num.$eq(0)
  .$set({ num: 2, arr: [], objArr: [], obj: { num: 0 } });

store0.objArray
  .$find.num.$eq(0)
  .num.$set(3);

store0.objArray
  .$find.arr.$eq([])
  .$set({ num: 3, arr: [], objArr: [], obj: { num: 0 } });

store0.objArray
  .$find.num.$eq(3)
  .arr.$find.$eq(0)
  .$set(0);

store0.objArray
  .$find.num.$eq(3)
  .objArr.$find.$eq({ num: 3 })
  .$set({ num: 2 });

store0.objArray
  .$find.num.$eq(3)
  .objArr.$find.num.$eq(3)
  .$set({ num: 2 });

store0.object
  .$patch({ two: 'd', three: 3 });

store0.array
  .$find.$in([0])
  .$set(0);

store0.objArray
  .$find.$in([{ arr: [], num: 0, objArr: [], obj: { num: 0 } }])
  .$set({ arr: [], num: 0, objArr: [], obj: { num: 0 } });


store0.objArray
  .$find.num.$eq(3).$or.arr.$eq([])
  .$delete();

store0.objArray
  .num.$set(2);

store0.objArray
  .$find.num.$eq(3)
  .num.$set(3)

store0.arrayTuple
  .$find.$in(['hello']).$and.$eq('world')
  .$set('world');

store0.array
  .$find.$eq(3)
  .$add(3);

store0.number.$add(3);

store0.array
  .$state;

store0.array
  .$filter.$eq(2)
  .$state;

store0.$state;

store0.objArray
  .$find.num.$eq(3)
  .objArr.$find.num.$eq(3)
  .$state;

store0.array
  .$find.$eq(3).$and.$lt(5)
  .$state;

store0.objArray
  .$mergeMatching.obj.num
  .$with({ num: 3, arr: [], objArr: [], obj: { num: 0 } });

store0.objArray
  .$mergeMatching.obj.num
  .$with([{ num: 3, arr: [], objArr: [], obj: { num: 0 } }]);

store0.objArray
  .objArr.$find.num.$eq(3)
  .$patch({ num: 4 });

store0
  .arrayStr.$merge('hello');

store0
  .arrayBool.$merge(true);



export const demo = () => {
  type User = { name: string, age: number };
  type Todo = { id: number, title: string, status: 'done' | 'todo' };
  const store = createStore({
    user: { name: '', age: 0 } as User,
    todos: new Array<Todo>(),
  });

  store.user.age
    .$add(1);
  // { type: 'user.age.increment()', payload: 1 }

  store.todos
    .$find.id.$eq(3).status
    .$set('todo');
  // { type: 'todos.find.id.eq(3).status.set()', payload: 'todo' }

  store.todos
    .$filter.status.$eq('done')
    .$delete();
  // { type: 'todos.filter.status.eq(done).set()' }

  store.user.name.$set('test');
  // { type: 'user.name.set()', payload: 'test' }

  // store.todos.status.$set
  // store.user.name.
  store.todos.$filter.id.$eq(3).status.$set('done');
  store.todos.$find.id.$eq(3).status.$set

  store.todos.$filter.id.$eq(3).id.$add(1);
  store.todos.$find.id.$eq(3).id.$add(1);

  store.user.age.$set(3);
  store.user.name.$set('ss');

  store.todos.$find.id.$eq(3).status.$set('done');

}

export const demo2 = () => {
  const store = createStore({
    arr: [
      { id: 1, obj: { id: 1, str: '', num: 0 } }
    ]
  });
  store.arr.$filter.id.$eq(3).obj.$set({ id: 1, num: 1, str: '' });
  store.arr.$find.id.$eq(3).obj.$set({ id: 1, num: 1, str: '' });
  store.arr.$set([])
  store.arr.$find.id.$gt(3).$set({ id: 1, obj: { id: 1, num: 1, str: '' } })

}

export const demo3 = () => {
  createStore({
    state: {
      arr: [{ id: 1, val: '' }],
    }
  });
}


type Todo = { id: number, title: string, status: 'done' | 'todo' };
type User = { name: string, age: number };
type State = { user: User; todos: Todo[] }

const store = createStore<State>({
  user: { name: '', age: 0 }, todos: []
})


store.todos.$filter.status.$eq('done').$set // additional impl required


store.todos.$filter.status.$eq('done').$delete();
// { type: 'todos.filter.status.eq(done).delete()' }



store.todos.$filter.status.$eq('done').$set([]);


const storee = createStore({
  todos: [''],
  things: [{ id: 1, name: '' }],
  val: '',
  num: 0,
  bool: false,
  arr: [false],
  more: [{id: 1, status: false}]
});
storee.bool.$set(true);
storee.num.$set(3);
storee.val.$set('sss');
storee.todos.$set(['ss']);
storee.things.$set([{ id: 2, name: '' }]);
storee.todos.$filter.$eq('').$set('ss');
storee.things.$filter.id.$eq(3).$set([{ id: 2, name: '' }]);
storee.things.$filter.id.$eq(3).name.$set('');
// storee.arr.

// const storey = createStore({
//   state: {
//     showOptionsFor: null,
//     tagId: null,
//   }
// })

// storey.$patch({
//   showOptionsFdor: 'group',
//   tagId: null,
// });

// // const thing: Payload<Partial<{ one: '', two: '' }>> = {
// //   one: null,
// //   two: ''
// // }

// const myFn = <X extends Partial<{ str: string, num: number }>>(arg: X) => {
//   return arg;
// }

// myFn({thing: '', num: 3})

store.todos.$find.id.$eq(3).$set({ id: 3, title: 'hello', status: 'done' });
store.todos.$find.id.$eq(3).$patch({ status: 'done' });


const user = store.user.$state;
store.user.$set(user);
const todos = store.todos.$state;
store.todos.$set(todos);




const strr = createStore({ arr: [{ id: 1, name: '', obj: { one: 1 } }] });
strr.arr.$mergeMatching.id.$and.obj.one.$with({ id: 1, name: 'hello', obj: { one: 1 } });


// const result = addCalculationsToStore(store, {
//   sortedList: store.todos.$memoizeSortBy.id.$ascending(),
//   things: derive(store.todos, store.user).$with((todos, user) => todos.find(t => t.id === user.age)!)
// });

// result.$calculated.
// result.$calculated.sortedList.$state[0].;
// strr.arr.$createSortedList.name.$ascending.usingId.id();

strr.arr.$createSortedList.$withId.id.$sortedBy.name.$ascending();
