// Libraries
import React, { memo, useState, useEffect } from 'react';
import _ from 'lodash';

// Types
import { AbsoluteTimeRange, ExploreQueryFieldProps, ExploreMode } from '@grafana/data';
import { LokiDatasource } from '../datasource';
import { LokiQuery, LokiOptions } from '../types';
import { LokiQueryField } from './LokiQueryField';
import { useLokiSyntax } from './useLokiSyntax';
import { LokiExploreExtraField } from './LokiExploreExtraField';

type Props = ExploreQueryFieldProps<LokiDatasource, LokiQuery, LokiOptions>;

export function LokiExploreQueryEditor(props: Props) {
  const { query, data, datasource, exploreMode, history, onChange, onRunQuery } = props;

  let absolute: AbsoluteTimeRange;
  if (data && !_.isEmpty(data.request)) {
    const { range } = data.request;

    absolute = {
      from: range.from.valueOf(),
      to: range.to.valueOf(),
    };
  } else {
    absolute = {
      from: Date.now() - 10000,
      to: Date.now(),
    };
  }

  const [maxLines, setMaxLines] = useState(query?.maxLines?.toString() || datasource?.maxLines?.toString());

  const { isSyntaxReady, setActiveOption, refreshLabels, ...syntaxProps } = useLokiSyntax(
    datasource.languageProvider,
    absolute
  );

  function onChangeQueryLimit(value: string, override?: boolean) {
    const { query, onChange, onRunQuery } = props;
    if (onChange) {
      const nextQuery = { ...query, maxLines: preprocessMaxLines(value) };

      if (query?.expr?.length > 0) {
        onChange(nextQuery);
        if (override && onRunQuery) {
          onRunQuery();
        }
      }
    }
  }

  function preprocessMaxLines(value: string): number {
    if (value.length === 0) {
      // empty input - falls back to dataSource.maxLines limit
      return NaN;
    } else if (value.length > 0 && (isNaN(+value) || +value < 0)) {
      // input with at least 1 character and that is either incorrect (value in the input field is not a number) or negative
      // falls back to the limit of 0 lines
      return 0;
    } else {
      // default case - correct input
      return +value;
    }
  }

  useEffect(() => {
    onChangeQueryLimit(maxLines);
  }, [maxLines]);

  function onMaxLinesChange(e: React.SyntheticEvent<HTMLInputElement>) {
    setMaxLines(e.currentTarget.value);
  }

  function onReturnKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && parseInt(maxLines, 10) > 0) {
      onRunQuery();
    }
  }

  return (
    <LokiQueryField
      datasource={datasource}
      query={query}
      onChange={onChange}
      onRunQuery={onRunQuery}
      history={history}
      data={data}
      onLoadOptions={setActiveOption}
      onLabelsRefresh={refreshLabels}
      syntaxLoaded={isSyntaxReady}
      absoluteRange={absolute}
      ExtraFieldElement={
        exploreMode === ExploreMode.Logs ? (
          <LokiExploreExtraField
            label={'Line limit'}
            onChangeFunc={onMaxLinesChange}
            onKeyDownFunc={onReturnKeyDown}
            value={maxLines}
            type={'number'}
            min={0}
          />
        ) : null
      }
      {...syntaxProps}
    />
  );
}

export default memo(LokiExploreQueryEditor);
