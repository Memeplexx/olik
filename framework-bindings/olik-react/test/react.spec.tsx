import '@testing-library/jest-dom';

import { screen, waitFor } from '@testing-library/dom';
import { render } from '@testing-library/react';
import React from 'react';

import { createGlobalStore, useDerivationAcrossStores, useNestedStore } from '../src';

describe('React', () => {

  const initialState = {
    object: { property: 'a' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    string: 'b',
  };

  it('should create and update a store', () => {
    const {
      select
    } = createGlobalStore(initialState, { devtools: false });
    select(s => s.object.property)
      .replace('test');
    expect(select().read().object.property).toEqual('test');
  })

  it('should useSelector', () => {
    const {
      select,
      useSelector
    } = createGlobalStore(initialState, { devtools: false });
    const App = () => {
      const result = useSelector(s => s.object.property);
      return (
        <>
          <button onClick={() => select(s => s.object.property).replace('test')}>Click</button>
          <div data-testid="result">{result}</div>
        </>
      );
    };
    render(<App />);
    expect(screen.getByTestId('result').textContent).toEqual(initialState.object.property);
    (screen.getByRole('button') as HTMLButtonElement).click();
    expect(screen.getByTestId('result').textContent).toEqual('test');
  });

  it('should useDerivation with no deps', () => {
    const {
      select,
      useDerivation
    } = createGlobalStore(initialState, { devtools: false });
    let calcCount = 0;
    const App = () => {
      const result = useDerivation([
        s => s.string,
        s => s.object.property,
      ]).usingExpensiveCalc(([str, prop]) => {
        calcCount++;
        return str + prop;
      });
      return (
        <>
          <button onClick={() => select(s => s.object.property).replace('test')}>Click</button>
          <div data-testid="result">{result}</div>
        </>
      );
    };
    render(<App />);
    expect(screen.getByTestId('result').textContent).toEqual(initialState.string + initialState.object.property);
    expect(calcCount).toEqual(1);
    (screen.getByRole('button') as HTMLButtonElement).click();
    expect(screen.getByTestId('result').textContent).toEqual(initialState.string + 'test');
    expect(calcCount).toEqual(2);
  });

  it('should useDerivation with deps', () => {
    const {
      useDerivation
    } = createGlobalStore(initialState, { devtools: false });
    let calcCount = 0;
    const App = () => {
      const [str, setStr] = React.useState('');
      const [num, setNum] = React.useState(0);
      const result = useDerivation([
        s => s.string,
        s => s.object.property,
      ], [num]).usingExpensiveCalc(([str, prop]) => {
        calcCount++;
        return str + prop;
      });
      return (
        <>
          <button data-testid="btn-1" onClick={() => setStr('test')}>Click</button>
          <button data-testid="btn-2" onClick={() => setNum(1)}>Click</button>
          <div data-testid="result">{result}</div>
        </>
      );
    };
    render(<App />);
    expect(screen.getByTestId('result').textContent).toEqual(initialState.string + initialState.object.property);
    expect(calcCount).toEqual(1);
    (screen.getByTestId('btn-1') as HTMLButtonElement).click();
    expect(calcCount).toEqual(1);
    (screen.getByTestId('btn-2') as HTMLButtonElement).click();
    expect(calcCount).toEqual(2);
  });

  it('should useDerivation across stores', () => {
    const parent = createGlobalStore(initialState, { devtools: false });
    let calcCount = 0;
    const App = () => {
      const nested = useNestedStore({ hello: false }, { componentName: 'MyComponent', instanceName: '0' });
      const [num, setNum] = React.useState(0);
      const result = useDerivationAcrossStores([
        parent.select(s => s.array.find(e => e.id === 2)!.id),
        parent.select(s => s.object.property),
        nested.select(s => s.hello)
      ], [num]).usingExpensiveCalc(([i0, i1, i2]) => {
        calcCount++;
        return `${i0}-${i1}-${i2}-${num}`
      })
      return (
        <>
          <button data-testid="btn-1" onClick={() => parent.select(s => s.string).replace('test')}>Click</button>
          <button data-testid="btn-2" onClick={() => nested.select(s => s.hello).replace(true)}>Click</button>
          <button data-testid="btn-3" onClick={() => parent.select(s => s.object.property).replace('xxx')}>Click</button>
          <button data-testid="btn-4" onClick={() => setNum(n => n + 1)}>Click</button>
          <div data-testid="result">{result}</div>
        </>
      )
    }
    render(<App />);
    expect(screen.getByTestId('result').textContent).toEqual('2-a-false-0');
    (screen.getByTestId('btn-1') as HTMLButtonElement).click();
    expect(calcCount).toEqual(1);
    (screen.getByTestId('btn-2') as HTMLButtonElement).click();
    expect(screen.getByTestId('result').textContent).toEqual('2-a-true-0');
    expect(calcCount).toEqual(2);
    (screen.getByTestId('btn-3') as HTMLButtonElement).click();
    expect(screen.getByTestId('result').textContent).toEqual('2-xxx-true-0');
    expect(calcCount).toEqual(3);
    (screen.getByTestId('btn-4') as HTMLButtonElement).click();
    expect(screen.getByTestId('result').textContent).toEqual('2-xxx-true-1');
    expect(calcCount).toEqual(4);
  })

  it('should support classes', () => {
    const {
      select,
      mapStateToProps
    } = createGlobalStore(initialState, { devtools: false });
    let renderCount = 0;
    class Child extends React.Component<{ str: string, num: number }> {
      render() {
        renderCount++;
        return (
          <>
            <div data-testid="result-str">{this.props.str}</div>
            <div data-testid="result-num">{this.props.num}</div>
          </>
        );
      }
    }
    const Parent = mapStateToProps((state, ownProps: { someProp: number }) => ({
      str: state.object.property,
      num: ownProps.someProp,
    }))(Child);
    const App = () => {
      const [num, setNum] = React.useState(0);
      return (
        <>
          <Parent someProp={num} />
          <button data-testid="btn-1" onClick={() => select(s => s.string).replace('test')}>Test 1</button>
          <button data-testid="btn-2" onClick={() => select(s => s.object.property).replace('test')}>Test 2</button>
          <button data-testid="btn-3" onClick={() => setNum(n => n + 1)}>Test 3</button>
        </>
      )
    };
    render(<App />);
    expect(renderCount).toEqual(1);
    (screen.getByTestId('btn-1') as HTMLButtonElement).click();
    expect(renderCount).toEqual(1);
    (screen.getByTestId('btn-2') as HTMLButtonElement).click();
    expect(renderCount).toEqual(2);
    expect(screen.getByTestId('result-str').textContent).toEqual('test');
    expect(screen.getByTestId('result-num').textContent).toEqual('0');
    (screen.getByTestId('btn-3') as HTMLButtonElement).click();
    expect(screen.getByTestId('result-num').textContent).toEqual('1');
  });

  it('should create a nested store without a parent', () => {
    let renderCount = 0;
    const App = () => {
      const {
        select,
        useSelector
      } = useNestedStore(initialState, { componentName: 'unhosted', instanceName: '0', dontTrackWithDevtools: true });
      const result = useSelector(s => s.object.property);
      renderCount++;
      return (
        <>
          <button data-testid="btn-1" onClick={() => select(s => s.object.property).replace('test')}>Click</button>
          <button data-testid="btn-2" onClick={() => select(s => s.string).replace('test')}>Click</button>
          <div data-testid="result">{result}</div>
        </>
      );
    };
    render(<App />);
    expect(renderCount).toEqual(1);
    (screen.getByTestId('btn-1') as HTMLButtonElement).click();
    expect(screen.getByTestId('result').textContent).toEqual('test');
    expect(renderCount).toEqual(2);
    (screen.getByTestId('btn-2') as HTMLButtonElement).click();
    expect(renderCount).toEqual(2);
  });

  it('should create a nested store with a parent', () => {
    const parentStore = createGlobalStore({
      ...initialState,
      nested: {
        component: {} as { [key: string]: { prop: string } }
      }
    }, { devtools: false });
    let renderCount = 0;
    const Child = () => {
      const {
        select,
        useSelector,
      } = useNestedStore({ prop: '' }, { componentName: 'component', instanceName: '0', dontTrackWithDevtools: true });
      const result = useSelector(s => s.prop);
      renderCount++;
      return (
        <>
          <button data-testid="btn" onClick={() => select(s => s.prop).replace('test')}>Click</button>
          <div>{result}</div>
        </>
      );
    };
    const Parent = () => {
      return (
        <>
          <Child />
        </>
      );
    }
    render(<Parent />);
    expect(renderCount).toEqual(1);
    (screen.getByTestId('btn') as HTMLButtonElement).click();
    expect(renderCount).toEqual(2);
    expect(parentStore.select(s => s.nested.component).read()).toEqual({ '0': { prop: 'test' } });
  });


  it('nested store should receive props from parent', async () => {
    const parentStore = createGlobalStore({
      ...initialState,
      nested: {
        component2: {} as { [key: string]: { prop: string, num: number } }
      }
    }, { devtools: false });
    const Child: React.FunctionComponent<{ num: number }> = (props) => {
      const {
        select,
        useSelector,
      } = useNestedStore({ prop: 0 }, { componentName: 'component2', instanceName: '0', dontTrackWithDevtools: true });
      React.useEffect(() => select(s => s.prop).replace(props.num), [props.num])
      const result = useSelector(s => s.prop);
      return (
        <>
          <div>{result}</div>
        </>
      );
    };
    const Parent = () => {
      const [num, setNum] = React.useState(0);
      return (
        <>
          <Child num={num} />
          <button data-testid="btn" onClick={() => setNum(num + 1)}>Click</button>
        </>
      );
    }
    render(<Parent />);
    (screen.getByTestId('btn') as HTMLButtonElement).click();
    await waitFor(() => expect(parentStore.select(s => s.nested.component2).read()).toEqual({ '0': { prop: 1 } }));
  })

  it('should respond to async actions', async () => {
    const { select, useSelector } = createGlobalStore(initialState, { devtools: false });
    const App = () => {
      const state = useSelector(s => s.object.property);
      return (
        <>
          <button data-testid="btn" onClick={() => select(s => s.object.property)
            .replace(() => new Promise(resolve => setTimeout(() => resolve('test'), 10)))}>Click</button>
          <div data-testid="result">{state}</div>
        </>
      );
    }
    render(<App />);
    await (screen.getByTestId('btn') as HTMLButtonElement).click();
    await waitFor(() => expect(screen.getByTestId('result').textContent).toEqual('test'));
  });

  it('should respond to async queries', async () => {
    const {
      select,
      useFetcher
    } = createGlobalStore(initialState, { devtools: false });
    const App = () => {
      const {
        wasResolved,
        wasRejected,
        isLoading,
        storeValue
      } = useFetcher(() => select(s => s.object.property)
        .replace(() => new Promise(resolve => setTimeout(() => resolve('test'), 10))));
      return (
        <>
          <div data-testid="result">{storeValue}</div>
          {isLoading && <div>Loading</div>}
          {wasResolved && <div>Success</div>}
          {wasRejected && <div>Failure</div>}
        </>
      );
    }
    render(<App />);
    expect(screen.queryByText('Loading')).toBeInTheDocument();
    expect(screen.getByTestId('result').textContent).toEqual('a');
    await waitFor(() => expect(screen.getByTestId('result').textContent).toEqual('test'));
    expect(screen.queryByText('Success')).toBeInTheDocument();
    expect(screen.queryByText('Failure')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  })

  it('should respond to async queries', async () => {
    const {
      select,
      useFetcher
    } = createGlobalStore(initialState, { devtools: false });
    const App = () => {
      const {
        wasResolved,
        wasRejected,
        isLoading,
        error,
      } = useFetcher(() => select(s => s.object.property)
        .replace(() => new Promise<string>((resolve, reject) => setTimeout(() => reject('test'), 10))));
      return (
        <>
          <div data-testid="result">{error}</div>
          {isLoading && <div>Loading</div>}
          {wasResolved && <div>Success</div>}
          {wasRejected && <div>Failure</div>}
        </>
      );
    }
    render(<App />);
    expect(screen.queryByText('Loading')).toBeInTheDocument();
    expect(screen.getByTestId('result').textContent).toEqual('');
    await waitFor(() => expect(screen.getByTestId('result').textContent).toEqual('test'));
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
    expect(screen.queryByText('Failure')).toBeInTheDocument();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  })

  it('should be able to paginate', async () => {
    const todos = new Array(15).fill(null).map((e, i) => ({ id: i + 1, text: `value ${i + 1}` }));
    type Todo = { id: Number, text: string };
    const {
      select,
      useFetcher,
    } = createGlobalStore({
      toPaginate: {} as { [key: string]: Todo[] },
    }, { devtools: false });
    const App = () => {
      const [index, setIndex] = React.useState(0);
      const {
        wasResolved,
        wasRejected,
        isLoading,
        error,
        storeValue,
      } = useFetcher(() => select(s => s.toPaginate[index])
        .replaceAll(() => new Promise<Todo[]>(resolve => setTimeout(() => resolve(todos.slice(index * 10, (index * 10) + 10)), 10))), [index]);
      return (
        <>
          <button data-testid="btn" onClick={() => setIndex(1)}>Click</button>
          <div data-testid="result">{error}</div>
          {isLoading && <div>Loading</div>}
          {wasResolved && <div>Success</div>}
          {wasRejected && <div>Failure</div>}
          {wasResolved && <div data-testid='todos-length'>{storeValue.length}</div>}
        </>
      );
    }
    render(<App />);
    expect(screen.queryByText('Loading')).toBeInTheDocument();
    expect(screen.getByTestId('result').textContent).toEqual('');
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('todos-length').textContent).toEqual('10')
    });
    (screen.getByTestId('btn') as HTMLButtonElement).click();
    await waitFor(() => expect(screen.queryByText('Loading')).toBeInTheDocument());
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('todos-length').textContent).toEqual('5');
    });
  })

});

