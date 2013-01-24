/*!
 * TickTack.js v0.2
 *
 * 2012, Pablo Garaizar <http://garaizar.com/>
 *
 * Available under LGPL 3.0 license <http://www.gnu.org/licenses/lgpl-3.0.txt>
 */

;(function (root, undefined) {
//  'use strict';

  /** TickTack module definition */
  var TickTack = {};

  /** Assign each test an incremental id */
  var testId = 0;

  /**
   * The TickTack Test constructor.
   *
   * @constructor
   * @param {String} a description to identify the dataset.
   */
  TickTack.Test = function (description) {
    this.id = ++testId;
    this.description = description || new Date().toString(); // Asign current date as a fallback description
    this.dataset = [];
    this.diffs = [];
    this.clusters = [];
    this.statsDataset = {
      minimum: Infinity,
      maximum: -Infinity,
      median: 0,
      q1: 0,
      q3: 0,
      mean: 0,
      sd: 0,
      sem: 0,
      histogram: {}
    },
    this.statsDiffs = {
      minimum: Infinity,
      maximum: -Infinity,
      median: 0,
      q1: 0,
      q3: 0,
      mean: 0,
      sd: 0,
      sem: 0,
      histogram: {}
    },
    this.start = 0;
    this.stop = 0;
    this.cost = 0;
    this.granularity = 0;
    this.monotonicity = true;
    return this;
  };

  TickTack.Test.prototype = {
    id: 0,               // {Number}  id of the dataset
    description: '',     // {String}  custom description of the dataset
    dataset: [],         // {Array}   array of raw timestamps
    diffs: [],           // {Array}   array of diffs between timestamps
    clusters: [],        // {Array}   array of clusters {min, max, begin, end},
    statsDataset: {      // {Object}  stats of the dataset
      minimum: Infinity,
      maximum: -Infinity,
      median: 0,
      q1: 0,
      q3: 0,
      mean: 0,
      sd: 0,
      sem: 0,
      histogram: {}
    },
    statsDiffs: {        // {Object}  stats of the diffs
      minimum: Infinity,
      maximum: -Infinity,
      median: 0,
      q1: 0,
      q3: 0,
      mean: 0,
      sd: 0,
      sem: 0,
      histogram: {}
    },
    start: 0,            // {Number}  start timestamp
    stop: 0,             // {Number}  stop timestamp
    cost: 0,             // {Number}  cost of the timing function call
    granularity: 0,      // {Number}  minimum measurable interval of the timing function
    monotonicity: true,  // {Boolean} is this dataset monotonically increasing?

    /**
     * Benchmarks a timing function.
     *
     * @param {Function} timing function to be benchmarked.
     * @param {Number} number of calls to the benchmarked timing function.
     * @returns nothing.
     */
    benchmark: function (fn, n) {
      var data = [];

      this.start = fn();
      do {
        data.push(fn());
      } while (--n);
      this.stop = fn();

      this.dataset = data;
    },

    /**
     * Logs a call into the dataset.
     *
     * @param {Number} timeStamp (optional).
     * @returns nothing.
     */
    log: function (t) {
      var timeStamp = t || +new Date;
      this.start = this.start || timeStamp;
      this.dataset.push(timeStamp);
      this.end = timeStamp;
    },

    /**
     * Generates diffs array.
     *
     * @returns {Array} diffs array.
     */
    getDiffs: function () {
      var data = this.dataset,
          d = [];

      for (var i = 0, len = data.length - 1; i < len; i++) {
        d.push(data[i + 1] - data[i]);
      }
      this.diffs = d;

      return d;
    },

    /**
     * Generates clusters array.
     *
     * @param {Number} threshold (optional).
     * @returns {Array} clusters array.
     */
    getClusters: function (t) {
      var data = this.dataset,
          c = [],
          value = data[0],
          last = value,
          n = 0,
          thres = t || 0;

      c.push({ minimum: value, maximum: value, begin: 0, end: 0});

      for (var i = 0, len = data.length; i < len; i++) {
        value = data[i];
        if (value > last + thres) {
          c[n].maximum = data[i - 1];
          c[n].end = i;
          n++;
          c.push({ minimum: value, maximum: value, begin: i, end: i});
          last = value;
        }
      }

      c[n].maximum = last;
      c[n].end = data.length - 1;

      this.clusters = c;

      return c;
    },

    /**
     * Analyzes an array of values.
     *
     * @param {Array} array.
     * @returns {Object} analyzed values.
     */
    analyzeData: function (data) {
      var len = data.length,
           d,
           sum = 0,
           nmin = Infinity,
           nmax = -Infinity,
           m,
           v = 0,
           init = data[0],
           hist = {},
           stats = {},
           dsort = data.slice(0).sort();

      for (var i = 0; i < len; i++) {
        d = data[i];
        sum += d;
        nmin = (nmin > d) ? d : nmin;
        nmax = (nmax < d) ? d : nmax;
        hist[d - init] = hist[d - init] + 1 || 1;
      }
      m = sum / len;
      for (var i = 0; i < len; i++) {
        d = data[i] - m;
        v += d * d;
      }

      stats.minimum = nmin;
      stats.maximum = nmax;
      if (len % 2 == 0) {
        stats.median = dsort[len / 2];
      } else {
        stats.median = (dsort[Math.floor(len / 2)] + dsort[Math.ceil(len / 2)]) / 2;
      }
      stats.q1 = (dsort[Math.floor(len / 4)] + dsort[Math.ceil(len / 4)]) / 2;
      stats.q3 = (dsort[Math.floor(3 * len / 4)] + dsort[Math.ceil(3 * len / 4)]) / 2;
      stats.mean = m;
      stats.sd = Math.sqrt(v / len);
      stats.sem = stats.sd / Math.sqrt(len);
      stats.histogram = hist;

      return stats;
    },

    /**
     * Analyzes the dataset.
     *
     * @returns {Object} analyzed values.
     */
    analyzeDataset: function () {
      this.statsDataset = this.analyzeData(this.dataset);
      return this.statsDataset;
    },

    /**
     * Analyzes the diffs of the dataset.
     *
     * @returns {Object} analyzed values.
     */
    analyzeDiffs: function () {
      this.statsDiffs = this.analyzeData(this.getDiffs());
      return this.statsDiffs;
    },

    /**
     * Calculates the cost of the timing function call from the dataset.
     *
     * @returns {Number} cost of the timing function call.
     */
    getCost: function () {
      this.cost = (this.stop - this.start) / this.dataset.length;
      return this.cost;
    },

    /**
     * Calculates the granularity of the timing function from the dataset.
     *
     * @param {Array} array of sorted diffs (optional).
     * @returns {Number} granularity of the timing function.
     */
    getGranularity: function (d) {
      var data = d || this.getDiffs().sort(),
           len = data.length,
           n = 0;

      do {
        n++;
      } while (n < len && data[n] == 0);

      this.granularity = data[n];
      return this.granularity;
    },

    /**
     * Calculates the granularity of the timing function from the clusters.
     *
     * @param {Array} array of clusters (optional).
     * @returns {Object} statistics of the granularity of the timing function.
     */
    getGranularityClusters: function (d) {
      var data = d || this.getClusters(),
           len = data.length,
           g = [];

      if (len < 1) {
        g.push(getGranularity());
      } else {
        for (var i = 0, l = len - 1; i < l; i++) {
          g.push(((data[i + 1].maximum + data[i + 1].maximum) / 2) - ((data[i].maximum + data[i].maximum) / 2));
        }
      }

console.log(g);

      return this.analyzeData(g);
    },

    /**
     * Calculates the cost of the timing function call from the dataset.
     *
     * @param {Array} array of sorted diffs (optional).
     * @returns {Boolean} cost of the timing function call.
     */
    getMonotonicity: function (d) {
      var data = d || this.getDiffs().sort();
      this.monotonicity = (data[0] >= 0);
      return this.monotonicity;
    },

    /**
     * Analyzes all the data.
     *
     * @returns nothing.
     */
    analyze: function () {
      var d = this.getDiffs();
      this.analyzeDataset();
      this.statsDiffs = this.analyzeData(d);
      this.getClusters();
      this.getCost();
      d.sort();
      this.getGranularity(d);
      this.getMonotonicity(d);
    },

    /**
     * Generate an object with data values and options to be plotted by Flot.
     *
     * @param {Array} data array.
     * @param {Number} steps.
     * @returns {Object} Object with data values and options for Flot.
     */
    getDataPlot: function (data, s) {
      var init = data[0],
          d = [];

      s = s || 1;

      for (var i = 0, len = data.length; i < len; i += s) {
        d.push([i, data[i] - init]);
      }

      return {
        values: [
          { 
            label: this.description,
            data: d
          }
        ],
        options: {
          series: {
            lines: { show: true },
            points: { show: true }
          }
        }
      };
    },

    /**
     * Generate an object with histogram values and options to be plotted by Flot.
     *
     * @param {Object} histogram.
     * @returns {Object} Object with histogram values and options for Flot.
     */
    getHistogramPlot: function (h) {
      var d = [];

      for (var i in h) {
        d.push([i, h[i]]);
      }

      return {
        values: [
          { 
            label: this.description + " histogram",
            data: d
          }
        ],
        options: {
          series: {
            bars: { show: true },
            points: { show: true }
          }
        }
      };
    }

  };

  root['TickTack'] = TickTack;

})(typeof window!=='undefined' ? window : global);


