import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';

import { set, useNestedStore } from '../src';


configure({ adapter: new Adapter() });

describe('React', () => {

  const initialState = {
    object: { property: 'a' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    string: 'b',
  };

  it('should create and update a store', () => {
    const { select } = set(initialState, { devtools: false });
    select(s => s.object.property)
      .replace('test');
    expect(select().read().object.property).toEqual('test');
  })

  it('useSelector', () => {
    const { select, useSelector } = set(initialState, { devtools: false });
    const App = () => {
      const result = useSelector(s => s.object.property);
      return (
        <>
          <button onClick={() => select(s => s.object.property).replace('test')}>Click</button>
          <div>{result}</div>
        </>
      );
    };
    const wrapper = mount(<App />);
    expect(wrapper.find('div').text()).toEqual(initialState.object.property);
    wrapper.find('button').simulate('click');
    expect(wrapper.find('div').text()).toEqual('test');
  });

  it('useDerivation with no deps', () => {
    const { select, useDerivation } = set(initialState, { devtools: false });
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
          <div>{result}</div>
        </>
      );
    };
    const wrapper = mount(<App />);
    expect(wrapper.find('div').text()).toEqual(initialState.string + initialState.object.property);
    expect(calcCount).toEqual(1);
    wrapper.find('button').simulate('click');
    expect(wrapper.find('div').text()).toEqual(initialState.string + 'test');
    expect(calcCount).toEqual(2);
  });

  it('useDerivation with deps', () => {
    const { useDerivation } = set(initialState, { devtools: false });
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
          <button onClick={() => setStr('test')}>Click</button>
          <button onClick={() => setNum(1)}>Click</button>
          <div>{result}</div>
        </>
      );
    };
    const wrapper = mount(<App />);
    expect(wrapper.find('div').text()).toEqual(initialState.string + initialState.object.property);
    expect(calcCount).toEqual(1);
    wrapper.find('button').first().simulate('click');
    expect(calcCount).toEqual(1);
    wrapper.find('button').last().simulate('click');
    expect(calcCount).toEqual(2);
  });

  it('should support classes', () => {
    const { select, mapStateToProps } = set(initialState, { devtools: false });
    let renderCount = 0;
    class Child extends React.Component<{ str: string, num: number }> {
      render() {
        renderCount++;
        return (
          <>
            <div>{this.props.str}</div>
            <div>{this.props.num}</div>
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
          <button onClick={() => select(s => s.string).replace('test')}>Test 1</button>
          <button onClick={() => select(s => s.object.property).replace('test')}>Test 2</button>
          <button onClick={() => setNum(n => n + 1)}>Test 3</button>
        </>
      )
    };
    const wrapper = mount(<App />);
    expect(renderCount).toEqual(1);
    wrapper.find('button').at(0).simulate('click');
    expect(renderCount).toEqual(1);
    wrapper.find('button').at(1).simulate('click');
    expect(renderCount).toEqual(2);
    expect(wrapper.find(Parent).find(Child).find('div').at(0).text()).toEqual('test');
    expect(wrapper.find(Parent).find(Child).find('div').at(1).text()).toEqual('0');
    wrapper.find('button').at(2).simulate('click');
    expect(wrapper.find(Parent).find(Child).find('div').at(1).text()).toEqual('1');
  });

  it('should create a nested store without a parent', () => {
    let renderCount = 0;
    const App = () => {
      const { select, useSelector } = useNestedStore(initialState, { storeName: 'unhosted', dontTrackWithDevtools: true });
      const result = useSelector(s => s.object.property);
      renderCount++;
      return (
        <>
          <button onClick={() => select(s => s.object.property).replace('test')}>Click</button>
          <button onClick={() => select(s => s.string).replace('test')}>Click</button>
          <div>{result}</div>
        </>
      );
    };
    const wrapper = mount(<App />);
    expect(renderCount).toEqual(1);
    wrapper.find('button').at(0).simulate('click');
    expect(wrapper.find('div').text()).toEqual('test');
    expect(renderCount).toEqual(2);
    wrapper.find('button').at(1).simulate('click');
    expect(renderCount).toEqual(2);
  });

  it('should create a nested store without a parent', () => {
    let renderCount = 0;
    const App = () => {
      const { select, useSelector } = useNestedStore(initialState, { storeName: 'unhosted', dontTrackWithDevtools: true });
      const result = useSelector(s => s.object.property);
      renderCount++;
      return (
        <>
          <button onClick={() => select(s => s.object.property).replace('test')}>Click</button>
          <button onClick={() => select(s => s.string).replace('test')}>Click</button>
          <div>{result}</div>
        </>
      );
    };

    const wrapper = mount(<App />);
    expect(renderCount).toEqual(1);
    wrapper.find('button').at(0).simulate('click');
    expect(wrapper.find('div').text()).toEqual('test');
    expect(renderCount).toEqual(2);
    wrapper.find('button').at(1).simulate('click');
    expect(renderCount).toEqual(2);
  });

  it('should create a nested store with a parent', () => {
    const store = set({
      ...initialState,
      nested: {
        component: {} as { [key: string]: { prop: string } }
      }
    }, { devtools: false, isContainerForNestedStores: true });
    let renderCount = 0;
    const Child = () => {
      const { select, useSelector } = useNestedStore({ prop: '' }, { storeName: 'component', dontTrackWithDevtools: true });
      const result = useSelector(s => s.prop);
      renderCount++;
      return (
        <>
          <button onClick={() => select(s => s.prop).replace('test')}>Click</button>
          <div>{result}</div>
        </>
      );
    };
    const Parent = () => {
      const value = store.useSelector(s => s.object.property);
      return (
        <>
          <Child />
          <button onClick={() => store.select(s => s.object.property).replace('test')}>Click</button>
          {value}
        </>
      );
    }
    const wrapper = mount(<Parent />);
    expect(renderCount).toEqual(1);
    wrapper.find(Child).at(0).find('button').at(0).simulate('click');
    expect(renderCount).toEqual(2);
    expect(store.select(s => s.nested.component).read()).toEqual({'0': { prop: 'test' } });
  });

});
