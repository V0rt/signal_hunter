var d3 = require('d3')
var rpc = require('./RPCUtils.js')()

module.exports = function SignalHunter(options){

  // options.frequency
  // options.sample_rate
  // options.fft_size
  if(options === undefined){
    options = {}
  }

  if(options.frequency === undefined){
    options.frequency = 451000000
  }
  if(options.sample_rate === undefined){
    options.sample_rate = 2000000
  }
  if(options.fft_size === undefined){
    options.fft_size = 1024
  }

  var frequency = options.frequency
  var count_at_this_frequency = 0
  var limit = 100

  var scale_index_to_frequency = d3.scaleLinear()
    .domain([0, options.fft_size])
    .range([frequency-(options.sample_rate*0.5), frequency+(options.sample_rate*0.5)])

  var identified_signals = []
  var new_signals = []
  var previous_peaks = []
  var current_peaks = []

  //

  for(var i = 0; i < options.fft_size; i++){
    identified_signals.push(0)
    new_signals.push(0)
    previous_peaks.push(0)
    current_peaks.push(0)
  }

  function tick(new_peaks){

    count_at_this_frequency += 1
    if(count_at_this_frequency > limit){
      count_at_this_frequency = 0
      // frequency += 1000000
      rpc.set('frequency', frequency)
      scale_index_to_frequency = d3.scaleLinear()
        .domain([0, options.fft_size])
        .range([frequency-(options.sample_rate*0.5), frequency+(options.sample_rate*0.5)])
    }

    previous_peaks.forEach(function(v,idx){
      previous_peaks[idx] = current_peaks[idx]
    })
    current_peaks.forEach(function(v,idx){
      current_peaks[idx] = new_peaks[idx]
    })
    previous_peaks.forEach(function(previous_v,idx){
      // we are comparing the current peak value to the previous peak value
      var current_v = current_peaks[idx]

      // clear the new signals variable flag for this index
      new_signals[idx] = 0

      // search before and after?
      if(previous_v === 1 && current_v === 1){
        if(identified_signals[idx] === 0){
          // totally new signal found
          new_signals[idx] = 1
        }
        // running signal found for this index
        identified_signals[idx] = 1
      } else {
        // no running signal found for this index
        identified_signals[idx] = 0
      }
    })

    var found_signals = log_identified_signals()

    if(found_signals.length > 0){
      var a = []
      found_signals.forEach(function(v){
        a.push(Math.floor(v))
      })
      console.log(JSON.stringify(a))
    }

  }

  function log_identified_signals(){
    var freqs = []
    identified_signals.forEach(function(v, idx){
      if(v === 1){
        freqs.push(scale_index_to_frequency(idx))
      }
    })
    return freqs
  }

  function log_new_signals(){
    var freqs = []
    new_signals.forEach(function(v, idx){
      if(v === 1){
        freqs.push(scale_index_to_frequency(idx))
      }
    })
    return freqs
  }

  function set_frequency(f){
    frequency = f
  }
  function get_frequency(f){
    return frequency
  }

  return {
    tick: tick,
    set_frequency: set_frequency,
    get_frequency: get_frequency
  }

}