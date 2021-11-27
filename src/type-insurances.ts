import { createApplicationStore } from ".";

function test() {
  const select = createApplicationStore({
    number: 0,
    string: '',
    array: new Array<number>(),
    arrayStr: new Array<string>(),
    arrayBool: new Array<boolean>(),
    arrayTuple: new Array<'hello' | 'world'>(),
    objArray: new Array<{ num: number, arr: Array<number>, objArr: Array<{ num: number }>, obj: { num: number } }>(),
    object: { one: '', two: '', three: 0 }
  });

  select.objArray
    .find.obj.num.eq(3)
    .remove();

  // select.array
  //   .replace([0]);

  select.string
    .replace('test');

  select.array
    .find.eq(0)
    .replace(0);

  // select.arrayStr
  //   .replace(['one'])

  select.objArray
    .find.eq({ num: 0, arr: [], objArr: [], obj: { num: 0 } })
    .num.replace(3)

  select.objArray
    .find.num.eq(0)
    .replace({ num: 2, arr: [], objArr: [], obj: { num: 0 } });

  select.objArray
    .find.num.eq(0)
    .num.replace(3);

  select.objArray
    .find.arr.eq([])
    .replace({ num: 3, arr: [], objArr: [], obj: { num: 0 } });

  select.objArray
    .find.num.eq(3)
    .arr.find.eq(0)
    .replace(0);

  select.objArray
    .find.num.eq(3)
    .objArr.find.eq({ num: 3 })
    .replace({ num: 2 });

  select.objArray
    .find.num.eq(3)
    .objArr.find.num.eq(3)
    .replace({ num: 2 });

  select.object
    .patch({ two: 'd' });

  select.array
    .find.in([0])
    .replace(0);

  select.objArray
    .find.in([{ arr: [], num: 0, objArr: [], obj: { num: 0 } }])
    .replace({ arr: [], num: 0, objArr: [], obj: { num: 0 } });


  select.objArray
    .find.num.eq(3).or.arr.eq([])
    .remove();

  select.objArray
    .num.replaceAll(2);

  select.objArray
    .find.num.eq(3)
    .num.replace(3)

  select.arrayBool.find.eq(true).remove();

  select.arrayTuple
    .find.in(['hello']).and.eq('world')
    .replace('world');


  select.array
    .find.eq(3)
    .increment(3)

  select.number.increment(3);

  const rr = select.array
    .read();

  const r = select.objArray
    .filter.eq(null as any)
    .read();

  const rrr = select.array
    .filter.eq(2)
    .read();

  const rrrr = select.read();

  const abc = select.objArray
    .find.num.eq(3)
    .objArr.find.num.eq(3)
    .read();

  const e = select.array
    .find.eq(3).and.lt(5)
    .read();

  select.objArray
    .upsertMatching.obj.num
    .withOne({ num: 3, arr: [], objArr: [], obj: { num: 0 } });

  select.objArray
    .upsertMatching.obj.num
    .withMany([{ num: 3, arr: [], objArr: [], obj: { num: 0 } }]);


    // select.objArray.filter.num.eq(1).

}