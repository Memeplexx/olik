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

  store.todos.$find.id.$eq(3).status.$replace('done');

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
  store.arr.$filter.id.$eq(3).obj.$replace({id: 1, num: 1, str: ''});
  store.arr.$find.id.$eq(3).obj.$replace({id: 1, num: 1, str: ''});
  store.arr.$replace([])
  store.arr.$find.id.$gt(3).$replace({id: 1, obj: { id: 1, num: 1, str: '' }})

}

export const demo3 = () => {
  const store = createStore({
    name: '???',
    state: [{ id: 1, val: '' }]
  });
}




const updateUserOnApi = (user: User) => () => new Promise<User>(resolve => resolve(user));

type Todo = { id: number, title: string, status: 'done' | 'todo' };
type User = { name: string, age: number };
type State = { user: User; todos: Todo[] }

const store = createStore<State>({
  name: document.title,
  state: { user: { name: '', age: 0 }, todos: [] }
})


function addToUsersAge(toAdd: number) {
  store.user.age.$add(toAdd);
  // { type: user.age.add(), payload: 3 }
}


function completeTodo(todoId: number) {
  store.todos.$find.id.$eq(todoId).status.$replace('done');
  // { type: todos.find.id.eq(3).status.replace(), payload: 'done' }
}


function updateUserDetails(user: User) {
  store.user.$replace(updateUserOnApi(user), { eager: user });
  // { type: user.replace(), payload: { name: 'James', age: 33 } }
}

store.todos.$filter.status.$eq('done').$replace // additional impl required


store.todos.$filter.status.$eq('done').$remove();
// { type: 'todos.filter.status.eq(done).remove()' }



store.todos.$filter.status.$eq('done').$replace([]);


const storee = createStore({
  state: {
    todos: [''],
    things: [{ id: 1, name: '' }],
    val: '',
  },
  name: 'x',
});
storee.val.$replace('sss');
storee.todos.$replace(['ss']);
storee.todos.$filter.$eq('').$replace('ss');
storee.things.$filter.id.$eq(3).$replace([{ id: 2, name: '' }]);
storee.things.$filter.id.$eq(3).name.$replace('');


storee.val.$replace('xxxx');


const storeee = createStore({
  name: 'xxx',
  state: {
    arr: new Array<TagId>(),
  }
});
const nums = storeee.arr.$state;
const num = nums[0];
storeee.arr.$replace(nums);
// storeee.arr.$add(num);



type TagId = number & { kind: 'tagId' };
const tagIds = [{id: 0 as TagId}].map(tag => tag.id);
const ids = storeee.arr.$state;
storeee.arr.$replace(ids.some(id => tagIds.includes(id)) ? ids.filter(i => !tagIds.includes(i)) : [...ids, ...tagIds]);