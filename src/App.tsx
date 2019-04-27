import React, { Component } from 'react';
import axios from 'axios';
import { scaleLinear, scaleTime } from 'd3-scale';
import { max, min } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { url } from './constants';

interface AppProps {}
interface AppState {
  xMaxDate: Date | undefined;
  xMinDate: Date | undefined;
  error: string | null;
  data: [string, number][] | null;
  gdp: number[] | null;
  gdpMax: number | undefined;
  yearsDate: Date[] | null;
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      xMaxDate: new Date(Date.now()),
      xMinDate: new Date(Date.now()),
      error: null,
      data: null,
      gdp: null,
      gdpMax: 0,
      yearsDate: null
    };
  }
  componentDidMount = async () => {
    try {
      const {
        data
      }: {
        data: [string, number][];
      } = await axios.get(url).then(({ data }) => data);
      // data is array of arrays, data on first index of an array is a date
      const yearsDate: Date[] = data.map(([year]) => new Date(year));
      // x-axis max
      const xMaxDate = new Date(`${max(yearsDate)}`);
      // set to the end of quarters
      xMaxDate.setMonth(xMaxDate.getMonth() + 3); // e.g.: 0 = jan. 0+3=3, 3=march
      // x-axis min
      const xMinDate = min(yearsDate) as Date;

      const gdp: number[] = data.map(([, gdp]) => gdp);
      const gdpMax = max(gdp);

      this.setState({ xMaxDate, xMinDate, data, gdp, gdpMax, yearsDate });
      this.createBarChart();
    } catch (error) {
      this.setState({ error });
    }
  };
  createBarChart = () => {
    const { data, xMinDate, xMaxDate, gdpMax, gdp, yearsDate } = this.state;
    const yMargin = 40,
      width = 800,
      height = 400;
    var tooltip = select('.barchart')
      .append('div')
      .attr('id', 'tooltip')
      .style('opacity', 0);

    var overlay = select('.barchart')
      .append('div')
      .attr('class', 'overlay')
      .style('opacity', 0);

    const svgNode = select('.barchart')
      .attr('width', width + 100)
      .attr('height', height + 60);

    svgNode
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -200)
      .attr('y', 80)
      .text('Gross Domestic Product');

    svgNode
      .append('text')
      .attr('x', width / 2 + 120)
      .attr('y', height + 50)
      .text('More Information: http://www.bea.gov/national/pdf/nipaguid.pdf')
      .attr('class', 'info');

    if (
      xMinDate &&
      xMaxDate &&
      gdpMax &&
      gdp &&
      yearsDate &&
      data &&
      yearsDate
    ) {
      // handle bottom x axis
      // using scaleTime because of date
      const xScale = scaleTime()
        .domain([xMinDate, xMaxDate])
        .range([0, width]);

      const xAxis = axisBottom(xScale);

      svgNode
        .append('g')
        .call(xAxis)
        .attr('id', 'x-axis')
        .attr('transform', 'translate(60, 400)');

      // handle left y axis
      const yAxisScale = scaleLinear()
        .domain([0, gdpMax])
        .range([height, 0]);

      const yAxis = axisLeft(yAxisScale);

      svgNode
        .append('g')
        .call(yAxis)
        .attr('id', 'y-axis')
        .attr('transform', 'translate(60, 0)');

      // chart data
      // scaleLinear -> https://www.youtube.com/watch?v=gGuJWQqsnXc

      const barWidth = width / 275;

      const linearScale = scaleLinear()
        .domain([0, gdpMax])
        .range([0, height]);

      const scaledGdp = gdp.map(item => linearScale(item));

      svgNode
        .selectAll('rect')
        .data(scaledGdp)
        .enter()
        .append('rect')
        .attr('data-date', function(d, i) {
          return data[i][0];
        })
        .attr('data-gdp', function(d, i) {
          return data[i][1];
        })
        .attr('class', 'bar')
        .attr('x', function(d, i) {
          console.log('ts i ', i);
          console.log('ts yearsDate[i] i ', yearsDate[i]);
          return xScale(yearsDate[i]);
        })
        .attr('y', function(d, i) {
          return height - d;
        })
        .attr('width', barWidth)
        .attr('height', function(d) {
          return d;
        })
        .style('fill', '#33adff')
        .attr('transform', 'translate(60, 0)');
    }
  };
  render() {
    return <svg className='barchart' />;
  }
}

export default App;
