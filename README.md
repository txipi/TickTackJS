TickTackJS
==========

Timer & timing function analysis library for JavaScript

Overview
========

TickTackJS is a timer & timing function analysis library for JavaScript.

TickTackJS allows to perform tests on timers and timing functions to get the monotonicity, granularity (cluster-based analysis) and cost of call. It also provides several kinds of plots of gathered results (in a Flot-compatible JSON format).

Features
========

Data gathering

- Logging
- Benchmarking

Data preprocessing

- Diffs
- Cluster detection

Stats

- Maximum
- Minimum
- Mean
- Median
- Q1
- Q3
- Standard deviation
- Standard Error of Mean
- Histogram

Plots

- Raw data plot.
- Diff data plot.
- Raw data histogram plot.
- Diff data histogram plot.

How to use it
=============

How to use it

Include TickTackJS and Flot + jQuery:

    <script language="javascript" type="text/javascript" src="js/jquery.min.js"></script>
    <script language="javascript" type="text/javascript" src="js/jquery.flot.min.js"></script>
    <script language="javascript" type="text/javascript" src="js/ticktack.js"></script>

Create a TickTackJS Dataset:

    var test = new TickTack.Test('Test Date');

Benchmark a timing function:

    test.benchmark(function () { return +new Date; }, 1000);

Analyze data:

    test.analyze();

Get monotonicity, granularity and cost of the timing function call:

    console.log(test.getMonotonicity(), test.getGranularity(), test.getCost());

Generate a plot (it will be placed in a div with id='plot1'):

    var plot1 = test.test.getDataPlot(test.dataset, 1)
    $.plot($('#plot1'), plot1.values, plot1.options);

Acknowledgements
================

Plots are created using Flot, a pure Javascript plotting library for jQuery, by Ole Laursen http://code.google.com/p/flot/.
