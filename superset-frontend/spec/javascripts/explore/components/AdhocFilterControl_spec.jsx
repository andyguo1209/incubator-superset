/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/* eslint-disable no-unused-expressions */
import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';

import Select from 'src/components/Select';
import AdhocFilter, {
  EXPRESSION_TYPES,
  CLAUSES,
} from 'src/explore/AdhocFilter';
import AdhocFilterControl from 'src/explore/components/controls/AdhocFilterControl';
import AdhocMetric from 'src/explore/AdhocMetric';
import { AGGREGATES, OPERATORS } from 'src/explore/constants';

const simpleAdhocFilter = new AdhocFilter({
  expressionType: EXPRESSION_TYPES.SIMPLE,
  subject: 'value',
  operator: '>',
  comparator: '10',
  clause: CLAUSES.WHERE,
});

const sumValueAdhocMetric = new AdhocMetric({
  expressionType: EXPRESSION_TYPES.SIMPLE,
  column: { type: 'VARCHAR(255)', column_name: 'source' },
  aggregate: AGGREGATES.SUM,
});

const savedMetric = { metric_name: 'sum__value', expression: 'SUM(value)' };

const columns = [
  { type: 'VARCHAR(255)', column_name: 'source' },
  { type: 'VARCHAR(255)', column_name: 'target' },
  { type: 'DOUBLE', column_name: 'value' },
];

const formData = {
  metric: undefined,
  metrics: [sumValueAdhocMetric, savedMetric.saved_metric_name],
};

function setup(overrides) {
  const onChange = sinon.spy();
  const props = {
    onChange,
    value: [simpleAdhocFilter],
    datasource: { type: 'table' },
    columns,
    savedMetrics: [savedMetric],
    formData,
    ...overrides,
  };
  const wrapper = shallow(<AdhocFilterControl {...props} />);
  return { wrapper, onChange };
}

describe('AdhocFilterControl', () => {
  it('renders Select', () => {
    const { wrapper } = setup();
    expect(wrapper.find(Select)).toExist();
  });

  it('handles saved metrics being selected to filter on', () => {
    const { wrapper, onChange } = setup({ value: [] });
    const select = wrapper.find(Select);
    select.simulate('change', [{ saved_metric_name: 'sum__value' }]);

    const adhocFilter = onChange.lastCall.args[0][0];
    expect(adhocFilter instanceof AdhocFilter).toBe(true);
    expect(
      adhocFilter.equals(
        new AdhocFilter({
          expressionType: EXPRESSION_TYPES.SQL,
          subject: savedMetric.expression,
          operator: OPERATORS['>'],
          comparator: 0,
          clause: CLAUSES.HAVING,
        }),
      ),
    ).toBe(true);
  });

  it('handles adhoc metrics being selected to filter on', () => {
    const { wrapper, onChange } = setup({ value: [] });
    const select = wrapper.find(Select);
    select.simulate('change', [sumValueAdhocMetric]);

    const adhocFilter = onChange.lastCall.args[0][0];
    expect(adhocFilter instanceof AdhocFilter).toBe(true);
    expect(
      adhocFilter.equals(
        new AdhocFilter({
          expressionType: EXPRESSION_TYPES.SQL,
          subject: sumValueAdhocMetric.label,
          operator: OPERATORS['>'],
          comparator: 0,
          clause: CLAUSES.HAVING,
        }),
      ),
    ).toBe(true);
  });

  it('handles columns being selected to filter on', () => {
    const { wrapper, onChange } = setup({ value: [] });
    const select = wrapper.find(Select);
    select.simulate('change', [columns[0]]);

    const adhocFilter = onChange.lastCall.args[0][0];
    expect(adhocFilter instanceof AdhocFilter).toBe(true);
    expect(
      adhocFilter.equals(
        new AdhocFilter({
          expressionType: EXPRESSION_TYPES.SIMPLE,
          subject: columns[0].column_name,
          operator: OPERATORS['=='],
          comparator: '',
          clause: CLAUSES.WHERE,
        }),
      ),
    ).toBe(true);
  });

  it('persists existing filters even when new filters are added', () => {
    const { wrapper, onChange } = setup();
    const select = wrapper.find(Select);
    select.simulate('change', [simpleAdhocFilter, columns[0]]);

    const existingAdhocFilter = onChange.lastCall.args[0][0];
    expect(existingAdhocFilter instanceof AdhocFilter).toBe(true);
    expect(existingAdhocFilter.equals(simpleAdhocFilter)).toBe(true);

    const newAdhocFilter = onChange.lastCall.args[0][1];
    expect(newAdhocFilter instanceof AdhocFilter).toBe(true);
    expect(
      newAdhocFilter.equals(
        new AdhocFilter({
          expressionType: EXPRESSION_TYPES.SIMPLE,
          subject: columns[0].column_name,
          operator: OPERATORS['=='],
          comparator: '',
          clause: CLAUSES.WHERE,
        }),
      ),
    ).toBe(true);
  });
});
