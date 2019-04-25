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
  data: string[][] | null;
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      xMaxDate: new Date(Date.now()),
      xMinDate: new Date(Date.now()),
      error: null,
      data: null
    };
  }
  componentDidMount = async () => {
    try {
      interface res {
        data: string[][];
      }
      const { data }: res = await axios.get(url).then(({ data }) => data);
      // data is array of arrays, data on first index of an array is a date
      const yearsDate: string[] = data.map(([item]) => item);
      // x-axis max
      const xMaxDate = new Date(max(yearsDate) as string);
      // set to the end of quarters
      xMaxDate.setMonth(xMaxDate.getMonth() + 3); // month starts at 0:jan
      // x-axis min
      const xMinDate = new Date(min(yearsDate) as string);
      this.setState({ xMaxDate, xMinDate, data });
      this.createBarChart();
    } catch (error) {
      this.setState({ error });
    }
  };
  createBarChart = () => {
    const { data, xMinDate, xMaxDate } = this.state;
    const yMargin = 40,
      width = 800,
      height = 400,
      barWidth = data ? width / data.length : null;

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

    // handle bottom axis
    if (xMinDate && xMaxDate) {
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
    }
  };
  render() {
    return <svg className='barchart' />;
  }
}

export default App;
