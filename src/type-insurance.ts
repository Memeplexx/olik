import { transact } from '.';
import { createStore } from './core';

type Test = { num: number, arr: Array<number>, objArr: Array<{ num: number }>, obj: { num: number } };

interface Statee {
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
  const store = createStore<Statee>({
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
    .$set('test');

  store.array
    .$find.$eq(0)
    .$set(0);

  store.objArray
    .$find.$eq({ num: 0, arr: [], objArr: [], obj: { num: 0 } })
    .num.$set(3)

  store.objArray
    .$find.num.$eq(0)
    .$set({ num: 2, arr: [], objArr: [], obj: { num: 0 } });

  store.objArray
    .$find.num.$eq(0)
    .num.$set(3);

  store.objArray
    .$find.arr.$eq([])
    .$set({ num: 3, arr: [], objArr: [], obj: { num: 0 } });

  store.objArray
    .$find.num.$eq(3)
    .arr.$find.$eq(0)
    .$set(0);

  store.objArray
    .$find.num.$eq(3)
    .objArr.$find.$eq({ num: 3 })
    .$set({ num: 2 });

  store.objArray
    .$find.num.$eq(3)
    .objArr.$find.num.$eq(3)
    .$set({ num: 2 });

  store.object
    .$patch({ two: 'd' });

  store.array
    .$find.$in([0])
    .$set(0);

  store.objArray
    .$find.$in([{ arr: [], num: 0, objArr: [], obj: { num: 0 } }])
    .$set({ arr: [], num: 0, objArr: [], obj: { num: 0 } });


  store.objArray
    .$find.num.$eq(3).$or.arr.$eq([])
    .$remove();

  store.objArray
    .num.$set(2);

  store.objArray
    .$find.num.$eq(3)
    .num.$set(3)

  store.arrayTuple
    .$find.$in(['hello']).$and.$eq('world')
    .$set('world');

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
    .$repsertMatching.obj.num
    .$withOne({ num: 3, arr: [], objArr: [], obj: { num: 0 } });

  store.objArray
    .$repsertMatching.obj.num
    .$withMany([{ num: 3, arr: [], objArr: [], obj: { num: 0 } }]);

  store.objArray
    .objArr.$find.num.$eq(3)
    .$patch({ num: 4 });

}

export const demo = () => {
  const store = createStore({
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
    .$set('todo');
  // { type: 'todos.find.id.eq(3).status.set()', payload: 'todo' }

  store.todos
    .$filter.status.$eq('done')
    .$remove();
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
    state: {
      arr: [
        { id: 1, obj: { id: 1, str: '', num: 0 } }
      ]
    }
  });
  store.arr.$filter.id.$eq(3).obj.$set({id: 1, num: 1, str: ''});
  store.arr.$find.id.$eq(3).obj.$set({id: 1, num: 1, str: ''});
  store.arr.$set([])
  store.arr.$find.id.$gt(3).$set({id: 1, obj: { id: 1, num: 1, str: '' }})

}

export const demo3 = () => {
  const store = createStore({
    state: [{ id: 1, val: '' }]
  });
}




const updateUserOnApi = (user: User) => () => new Promise<User>(resolve => resolve(user));

type Todo = { id: number, title: string, status: 'done' | 'todo' };
type User = { name: string, age: number };
type State = { user: User; todos: Todo[] }

const store = createStore<State>({
  state: { user: { name: '', age: 0 }, todos: [] }
})


function addToUsersAge(toAdd: number) {
  store.user.age.$add(toAdd);
  // { type: user.age.add(), payload: 3 }
}


function completeTodo(todoId: number) {
  store.todos.$find.id.$eq(todoId).status.$set('done');
  // { type: todos.find.id.eq(3).status.set(), payload: 'done' }
}


function updateUserDetails(user: User) {
  store.user.$set(updateUserOnApi(user), { eager: user });
  // { type: user.set(), payload: { name: 'James', age: 33 } }
}

store.todos.$filter.status.$eq('done').$set // additional impl required


store.todos.$filter.status.$eq('done').$remove();
// { type: 'todos.filter.status.eq(done).remove()' }



store.todos.$filter.status.$eq('done').$set([]);


const storee = createStore({
  state: {
    todos: [''],
    things: [{ id: 1, name: '' }],
    val: '',
  },
});
storee.val.$set('sss');
storee.todos.$set(['ss']);
storee.todos.$filter.$eq('').$set('ss');
storee.things.$filter.id.$eq(3).$set([{ id: 2, name: '' }]);
storee.things.$filter.id.$eq(3).name.$set('');


storee.val.$set('xxxx');


