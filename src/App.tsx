import React, { Component } from 'react';
import axios from 'axios';
import { scaleLinear, scaleTime } from 'd3-scale';
import { max, min } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { url } from './constants';

interface AppProps {}
interface AppState {
  xMaxDate: Date;
  xMinDate: Date;
  error: string | null;
  data: [string, number][] | null;
  gdp: number[];
  gdpMax: number | undefined;
  yearsDate: Date[];
  yearQuarter: string[];
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      xMaxDate: new Date(Date.now()),
      xMinDate: new Date(Date.now()),
      error: null,
      data: null,
      gdp: [],
      gdpMax: 0,
      yearsDate: [],
      yearQuarter: []
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
      const yearQuarter = data.map(([date]) => {
        const monthInddex = date.substring(5, 7);
        let quarter;

        if (monthInddex === '01') {
          quarter = 'Q1';
        } else if (monthInddex === '04') {
          quarter = 'Q2';
        } else if (monthInddex === '07') {
          quarter = 'Q3';
        } else if (monthInddex === '10') {
          quarter = 'Q4';
        }
        return `${date.substring(0, 4)} ${quarter}`;
      });

      this.setState({
        xMaxDate,
        xMinDate,
        data,
        gdp,
        gdpMax,
        yearsDate,
        yearQuarter
      });
      this.createBarChart();
    } catch (error) {
      this.setState({ error });
    }
  };
  createBarChart = () => {
    const {
      data,
      xMinDate,
      xMaxDate,
      gdpMax,
      gdp,
      yearsDate,
      yearQuarter
    } = this.state;
    const yMargin = 40,
      width = 800,
      height = 400;

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
      yearQuarter
    ) {
      // handle bottom x axis
      // using scaleTime because of date
      const xScale = scaleTime()
        .domain([xMinDate, xMaxDate]) // start from earliest date tick to greatest
        .range([0, width]); // width of scale, 0 to width

      const xAxis = axisBottom(xScale); // draw axis on bottom

      svgNode
        .append('g')
        .call(xAxis)
        .attr('id', 'x-axis')
        .attr('transform', 'translate(60, 400)'); // translate(x,y)

      // handle left y axis
      const yAxisScale = scaleLinear()
        .domain([0, gdpMax]) // the greatest is gdpMax on ticks
        .range([height, 0]); // first range is greater to start from top, will be the greatest to bottom 0

      const yAxis = axisLeft(yAxisScale);

      svgNode
        .append('g')
        .call(yAxis)
        .attr('id', 'y-axis')
        .attr('transform', 'translate(60, 0)');

      // chart data
      // scaleLinear -> https://www.youtube.com/watch?v=gGuJWQqsnXc

      const barWidth = width / data.length;

      const linearScale = scaleLinear()
        .domain([0, gdpMax])
        .range([0, height]);

      const scaledGdp = gdp.map(item => linearScale(item));

      svgNode
        .selectAll('rect')
        .data(scaledGdp)
        .enter()
        .append('rect')
        .attr('data-date', (_d, i) => data[i][0])
        .attr('data-gdp', (_d, i) => data[i][1])
        .attr('class', 'bar')
        .attr('x', (_d, i) => xScale(yearsDate[i]))
        .attr('y', d => height - d)
        .attr('width', barWidth)
        .attr('height', d => d)
        .style('fill', '#33adff')
        .attr('transform', 'translate(60, 0)')
        .on('mouseover', (d, i, rects) => {
          select(rects[i]).style('fill', '#fff');
          svgNode
            .append('text')
            .attr('id', () => `rects${i}`)
            .attr('x', () => rects[i].x.baseVal.value)
            .attr('y', () => rects[i].y.baseVal.value)
            .append('tspan')
            .text(`${yearQuarter[i]}`)
            .attr('dy', '1em')
            .append('tspan')
            .text(
              `
            $${gdp[i].toFixed(1).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')} Billion`
            )
            .attr('dy', '1em')
            .attr('dx', '-5em');
        })
        .on('mouseout', (_d, i, rects) => {
          select(rects[i]).style('fill', '#33adff');
          svgNode.select(`#rects${i}`).remove();
        });
    }
  };
  render() {
    return <svg className='barchart' />;
  }
}

export default App;
