// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming shadcn/ui setup
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui setup
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Assuming shadcn/ui setup
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming shadcn/ui setup
import { Label } from "@/components/ui/label"; // Assuming shadcn/ui setup


// --- Constants and Types ---

// Define the structure for note ratios
interface NoteRatio {
  name: string;
  ratio: number;
  label: string;
}

// Define the available note ratios based on the text, including octave-up versions
const BASE_NOTE_RATIOS: Omit<NoteRatio, 'label'>[] = [
  // Base ratios from the text
  { name: "Root", ratio: 1 / 1 },
  { name: "Minor Third (6/5)", ratio: 6 / 5 },
  { name: "Minor Third (7/6)", ratio: 7 / 6 },
  { name: "Major Third", ratio: 5 / 4 },
  { name: "Perfect Fifth", ratio: 3 / 2 },
  { name: "Diminished Fifth", ratio: 7 / 5 },
  { name: "Augmented Fifth", ratio: 25 / 16 },
  { name: "Major Sixth", ratio: 5 / 3 },
  { name: "Barbershop Seventh", ratio: 7 / 4 },
  { name: "Major Seventh", ratio: 15 / 8 },
  { name: "Ninth", ratio: 9 / 8 },
  // { name: "Ninth (Octave Up)", ratio: 9/4 }, // This is already covered by Ninth + Octave
];

// Function to generate the full list including octave-up versions
const generateNoteRatios = (): NoteRatio[] => {
  const ratios: NoteRatio[] = [{ name: "None", ratio: 0, label: "---" }]; // Start with None

  BASE_NOTE_RATIOS.forEach(base => {
    // Add the original ratio
    ratios.push({
      ...base,
      label: `${base.name} (${base.ratio.toFixed(3)})` // Generate label
    });
    // Add the octave-up version (except for Root, as Root+Oct is just another Root)
    if (base.name !== "Root") {
      ratios.push({
        name: `${base.name} (+Oct)`,
        ratio: base.ratio * 2,
        label: `${base.name} (${(base.ratio * 2).toFixed(3)}) (+Oct)` // Generate label for octave up
      });
    } else {
      // Add an explicit Octave option for the Root
      ratios.push({
        name: `Octave`,
        ratio: 2,
        label: `Octave (2.000)`
      });
    }
  });

  // Sort alphabetically by label after "---" and "Root (1.000)"
  const noneOption = ratios.shift()!; // Remove "---"
  const rootOption = ratios.shift()!; // Remove "Root (1.000)"
  const octaveOption = ratios.shift()!; // Remove "Octave (2.000)"

  ratios.sort((a, b) => a.label.localeCompare(b.label)); // Sort the rest

  return [noneOption, rootOption, octaveOption, ...ratios]; // Add back in order
};

const NOTE_RATIOS: NoteRatio[] = generateNoteRatios();


// Define the structure for time domain data points
interface TimeDataPoint {
  time: number;
  [key: string]: number; // For wave1, wave2, wave3, wave4, sum
}

// Define the structure for frequency domain data points
interface FreqDataPoint {
  freq: number;
  harmonic: number;
  noteIndex: number; // 0 for root, 1-3 for others
  noteName: string;
  amplitude: number; // Represents harmonic strength (e.g., 1/harmonic)
}

// --- Helper Functions ---

// Function to calculate frequency from ratio and base frequency
const calculateFrequency = (baseFreq: number, ratio: number): number => {
  return baseFreq * ratio;
};

// Function to generate sine wave data
const generateSineWave = (frequency: number, time: number, amplitude: number = 1): number => {
  if (frequency === 0) return 0;
  return amplitude * Math.sin(2 * Math.PI * frequency * time);
};

// --- Components ---

// Component for the summary section
const SummaryContent: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Barbershop Harmony Explained</CardTitle>
      <CardDescription>Key concepts from the provided text.</CardDescription>
    </CardHeader>
    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
      <h4>Core Idea: Just Intonation & Ratios</h4>
      <p>
        Contestable Barbershop harmony relies on specific chords built from simple frequency ratios between notes. Unlike standard (even-tempered) tuning on instruments like pianos, Barbershop singers aim for <em>just intonation</em>. This means the frequencies of the notes in a chord have precise mathematical relationships (e.g., 5/4 for a major third, 3/2 for a perfect fifth relative to the root).
      </p>
      <h4>The "Lock n' Ring" Phenomenon</h4>
      <p>
        When these simple frequency ratios are accurately sung, the overtones (natural harmonics) of the different notes align and reinforce each other. This creates a characteristic shimmering sound often described as "lock and ring," which is a hallmark of the style. Pianos, being tuned to compromise across all keys, cannot achieve this perfect alignment for most chords.
      </p>
      <h4>Allowed Chord Categories</h4>
      <p>Barbershop primarily uses three categories of chords, defined by their structure and characteristic sound:</p>
      <ul>
        <li>
          <strong>Major Chords:</strong> Based on the major triad (Root, Major Third 5/4, Perfect Fifth 3/2). Often include added notes like the Barbershop Seventh (7/4), Major Seventh (15/8), Ninth (9/8), or Major Sixth (5/3). The Barbershop Seventh (Root, M3, P5, B7 - ratios 4:5:6:7) is particularly iconic and prevalent due to its strong ringing quality.
        </li>
        <li>
          <strong>Minor Chords:</strong> Based on the minor triad (Root, Minor Third 6/5 or 7/6, Perfect Fifth). Often include added notes like the Major Sixth (5/3) or the Barbershop Seventh (7/4). The tuning of the minor third can vary slightly depending on the context.
        </li>
        <li>
          <strong>Symmetric Chords:</strong> Used mainly for transitions.
          <ul>
            <li><em>Diminished:</em> Equal minor third intervals (approx. 3 semitones). Hard to lock and ring due to complex ratios (smallest common denominator is 15 or higher). Useful for smooth voice leading.</li>
            <li><em>Augmented:</em> Equal major third intervals (4 semitones). Very rare, used as a last resort. Based on Root, Major Third (5/4), Augmented Fifth (25/16).</li>
          </ul>
        </li>
      </ul>
      <h4>Why These Chords?</h4>
      <p>
        Allowed chords generally feature simple frequency ratios (low least common denominator among notes), facilitating the "ring." Chord prevalence often correlates with ratio simplicity (e.g., Major/Barbershop Seventh LCD=4, Minor/Minor Sixth LCD=6). Practicality for voice leading also plays a role, especially for symmetric chords. Most chords use four unique notes, with the Dominant Ninth (a five-note chord where one is omitted) being the main exception.
      </p>
    </CardContent>
  </Card>
);

// Component for the Time Domain Visualizer
const TimeDomainVisualizer: React.FC = () => {
  // Find default notes by name/ratio (adjust if needed after list generation)
  const defaultRoot = NOTE_RATIOS.find(nr => nr.ratio === 1 / 1);
  const defaultM3 = NOTE_RATIOS.find(nr => nr.ratio === 5 / 4);
  const defaultP5 = NOTE_RATIOS.find(nr => nr.ratio === 3 / 2);
  const defaultB7 = NOTE_RATIOS.find(nr => nr.ratio === 7 / 4);

  const [baseFrequency, setBaseFrequency] = useState<number>(220); // A3
  const [selectedRatios, setSelectedRatios] = useState<(NoteRatio | null)[]>([
    defaultRoot || NOTE_RATIOS[1], // Fallback just in case
    defaultM3 || NOTE_RATIOS[4],
    defaultP5 || NOTE_RATIOS[5],
    defaultB7 || NOTE_RATIOS[9],
  ]);
  const [duration, setDuration] = useState<number>(0.02); // Time duration in seconds
  const [timeData, setTimeData] = useState<TimeDataPoint[]>([]);

  // Generate data for the time domain chart
  useEffect(() => {
    const sampleRate = 4000; // Samples per second
    const numSamples = Math.floor(duration * sampleRate);
    const data: TimeDataPoint[] = [];
    const activeFrequencies = selectedRatios
      .map(nr => nr ? calculateFrequency(baseFrequency, nr.ratio) : 0)
      .filter(freq => freq > 0); // Get non-zero frequencies

    for (let i = 0; i <= numSamples; i++) {
      const time = i / sampleRate;
      const point: TimeDataPoint = { time };
      let sum = 0;

      selectedRatios.forEach((noteRatio, index) => {
        const waveKey = `wave${index + 1}`;
        if (noteRatio && noteRatio.ratio > 0) {
          const freq = calculateFrequency(baseFrequency, noteRatio.ratio);
          // Normalize amplitude slightly if multiple waves are present
          const amplitude = activeFrequencies.length > 1 ? 1 / activeFrequencies.length : 1;
          point[waveKey] = generateSineWave(freq, time, amplitude);
          sum += point[waveKey];
        } else {
          point[waveKey] = 0; // Set to 0 if note is "None"
        }
      });
      point.sum = sum;
      data.push(point);
    }
    setTimeData(data);
  }, [baseFrequency, selectedRatios, duration]);

  // Handle dropdown changes
  const handleSelectChange = (index: number, value: string) => {
    // Find by label now, as labels are unique identifiers
    const newRatio = NOTE_RATIOS.find(nr => nr.label === value) || null;
    const newSelectedRatios = [...selectedRatios];
    newSelectedRatios[index] = newRatio;
    setSelectedRatios(newSelectedRatios);
  };

  // Define colors for the waves
  const waveColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Domain: Wave Superposition</CardTitle>
        <CardDescription>Visualize how selected notes combine over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Base Frequency Input */}
          <div>
            <Label htmlFor="baseFreqTime">Base Frequency (Hz)</Label>
            <Input
              id="baseFreqTime"
              type="number"
              value={baseFrequency}
              onChange={(e) => setBaseFrequency(Math.max(1, Number(e.target.value)))}
              min="1"
              className="w-full"
            />
          </div>
          {/* Duration Input */}
          <div>
            <Label htmlFor="durationTime">Duration (s)</Label>
            <Input
              id="durationTime"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(0.001, Number(e.target.value)))}
              min="0.001"
              step="0.001"
              className="w-full"
            />
          </div>
        </div>

        {/* Note Selection Dropdowns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {selectedRatios.map((_, index) => (
            <div key={index}>
              <Label htmlFor={`noteSelectTime${index}`}>Note {index + 1}</Label>
              <Select
                // Use label as the value for the Select component
                value={selectedRatios[index]?.label || NOTE_RATIOS[0].label}
                onValueChange={(value) => handleSelectChange(index, value)}
              >
                <SelectTrigger id={`noteSelectTime${index}`}>
                  <SelectValue placeholder={`Select Note ${index + 1}`} />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_RATIOS.map((nr) => (
                    <SelectItem key={nr.label} value={nr.label}>
                      {nr.label} {/* Display the label */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="w-full h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                type="number"
                domain={[0, duration]}
                tickFormatter={(tick) => `${tick.toFixed(3)}s`}
                label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis domain={[-1.1, 1.1]} label={{ value: 'Amplitude', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => value.toFixed(3)} labelFormatter={(label: number) => `Time: ${label.toFixed(4)}s`} />
              <Legend />
              {selectedRatios.map((noteRatio, index) =>
                noteRatio && noteRatio.ratio > 0 && (
                  <Line
                    key={`wave${index + 1}`}
                    type="monotone"
                    dataKey={`wave${index + 1}`}
                    name={noteRatio.label} // Use label in legend
                    stroke={waveColors[index]}
                    dot={false}
                    strokeWidth={1.5}
                    isAnimationActive={false} // Improve performance
                  />
                )
              )}
              <Line
                type="monotone"
                dataKey="sum"
                name="Sum"
                stroke="#e60049" // Distinct color for sum
                dot={false}
                strokeWidth={2}
                isAnimationActive={false} // Improve performance
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for the Frequency Domain Visualizer
const FrequencyDomainVisualizer: React.FC = () => {
  // Find default notes by name/ratio (adjust if needed after list generation)
  const defaultM3 = NOTE_RATIOS.find(nr => nr.ratio === 5 / 4);
  const defaultP5 = NOTE_RATIOS.find(nr => nr.ratio === 3 / 2);
  const defaultB7 = NOTE_RATIOS.find(nr => nr.ratio === 7 / 4);

  const [rootFrequency, setRootFrequency] = useState<number>(220); // A3
  const [selectedRatios, setSelectedRatios] = useState<(NoteRatio | null)[]>([
    defaultM3 || NOTE_RATIOS[4], // Fallback just in case
    defaultP5 || NOTE_RATIOS[5],
    defaultB7 || NOTE_RATIOS[9],
  ]);
  const [numHarmonics, setNumHarmonics] = useState<number>(5); // Number of harmonics to show
  const [freqData, setFreqData] = useState<FreqDataPoint[]>([]);
  const [maxFrequency, setMaxFrequency] = useState<number>(2000); // Max frequency for the chart axis

  // Generate data for the frequency domain chart
  useEffect(() => {
    const data: FreqDataPoint[] = [];
    let currentMaxFreq = 0;

    // Add Root harmonics
    if (rootFrequency > 0) {
      for (let i = 1; i <= numHarmonics; i++) {
        const freq = rootFrequency * i;
        data.push({
          freq: freq,
          harmonic: i,
          noteIndex: 0,
          noteName: "Root",
          amplitude: 1 / i // Amplitude decreases for higher harmonics
        });
        if (freq > currentMaxFreq) currentMaxFreq = freq;
      }
    }


    // Add harmonics for other selected notes
    selectedRatios.forEach((noteRatio, index) => {
      if (noteRatio && noteRatio.ratio > 0 && rootFrequency > 0) {
        const baseNoteFreq = calculateFrequency(rootFrequency, noteRatio.ratio);
        for (let i = 1; i <= numHarmonics; i++) {
          const freq = baseNoteFreq * i;
          data.push({
            freq: freq,
            harmonic: i,
            noteIndex: index + 1, // 1, 2, 3
            noteName: noteRatio.name, // Use name for internal logic if needed
            amplitude: 1 / i
          });
          if (freq > currentMaxFreq) currentMaxFreq = freq;
        }
      }
    });

    setFreqData(data);
    // Set max frequency slightly above the highest harmonic found
    setMaxFrequency(currentMaxFreq * 1.1 || 2000); // Ensure maxFrequency is not 0

  }, [rootFrequency, selectedRatios, numHarmonics]);

  // Handle dropdown changes
  const handleSelectChange = (index: number, value: string) => {
    // Find by label
    const newRatio = NOTE_RATIOS.find(nr => nr.label === value) || null;
    const newSelectedRatios = [...selectedRatios];
    newSelectedRatios[index] = newRatio;
    setSelectedRatios(newSelectedRatios);
  };

  // Define colors for the notes
  const noteColors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]; // Colors for Root, Note 1, Note 2, Note 3

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequency Domain: Harmonics</CardTitle>
        <CardDescription>Visualize fundamental frequencies and their harmonics.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Root Frequency Input */}
          <div>
            <Label htmlFor="rootFreq">Root Frequency (Hz)</Label>
            <Input
              id="rootFreq"
              type="number"
              value={rootFrequency}
              onChange={(e) => setRootFrequency(Math.max(1, Number(e.target.value)))}
              min="1"
              className="w-full"
            />
          </div>
          {/* Number of Harmonics Input */}
          <div>
            <Label htmlFor="numHarmonics">Number of Harmonics</Label>
            <Input
              id="numHarmonics"
              type="number"
              value={numHarmonics}
              onChange={(e) => setNumHarmonics(Math.max(1, Math.min(10, Number(e.target.value))))} // Limit harmonics
              min="1"
              max="10"
              step="1"
              className="w-full"
            />
          </div>
        </div>

        {/* Note Selection Dropdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {selectedRatios.map((_, index) => (
            <div key={index}>
              <Label htmlFor={`noteSelectFreq${index}`}>Additional Note {index + 1}</Label>
              <Select
                // Use label as the value
                value={selectedRatios[index]?.label || NOTE_RATIOS[0].label}
                onValueChange={(value) => handleSelectChange(index, value)}
              >
                <SelectTrigger id={`noteSelectFreq${index}`}>
                  <SelectValue placeholder={`Select Note ${index + 1}`} />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_RATIOS.map((nr) => (
                    <SelectItem key={nr.label} value={nr.label}>
                      {nr.label} {/* Display label */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="w-full h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="freq"
                name="Frequency"
                unit="Hz"
                domain={[0, maxFrequency]}
                label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -10 }}
              //tickFormatter={(tick) => Math.round(tick)}
              />
              <YAxis
                type="number"
                dataKey="amplitude"
                name="Harmonic Strength"
                domain={[0, 1.1]} // Amplitude ranges from 0 to 1
                label={{ value: 'Relative Amplitude', angle: -90, position: 'insideLeft' }}
                tickFormatter={(tick) => tick.toFixed(2)}
              />
              <ZAxis type="number" dataKey="harmonic" range={[50, 51]} name="Harmonic #" /> {/* Keep size constant */}
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: any, name: string, props: any) => {
                  if (name === 'Frequency') return `${(value as number).toFixed(1)} Hz`;
                  if (name === 'Harmonic Strength') return `${(value as number).toFixed(2)}`;
                  if (name === 'Harmonic #') return `Harmonic: ${value}`;
                  // Use payload to get noteName for the tooltip title
                  if (props.payload) {
                    return `${props.payload.noteName}: ${value}`;
                  }
                  return value;
                }}
                labelFormatter={(label: number, payload: any[]) => {
                  // Display Note Name and Harmonic # in the tooltip title
                  if (payload && payload.length > 0 && payload[0].payload) {
                    const point = payload[0].payload as FreqDataPoint;
                    return `${point.noteName} (Harmonic ${point.harmonic})`;
                  }
                  return '';
                }}
              />
              <Legend />
              {/* Scatter plot for Root */}
              <Scatter
                name="Root"
                data={freqData.filter(d => d.noteIndex === 0)}
                fill={noteColors[0]}
                shape="circle"
              />
              {/* Scatter plots for additional notes */}
              {selectedRatios.map((noteRatio, index) =>
                noteRatio && noteRatio.ratio > 0 && (
                  <Scatter
                    key={`note${index + 1}`}
                    name={noteRatio.label} // Use label in legend
                    data={freqData.filter(d => d.noteIndex === index + 1)}
                    fill={noteColors[index + 1]}
                    shape="triangle"
                  />
                )
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

interface ComparisonDataPoint {
  name: string;
  justFreq: number;
  etFreq: number;
  y: number; // For plotting on y-axis
}

// Component for the Tuning Comparison Visualizer
const TemperamentComparisonVisualizer: React.FC = () => {
  const [comparisonData, setComparisonData] = useState<ComparisonDataPoint[]>([]);

  useEffect(() => {
    const rootFreq = 440; // A4
    const justRatios: { [key: string]: number } = {
      'Root': 1 / 1,
      'Major Third': 5 / 4,
      'Perfect Fifth': 3 / 2,
      'Barbershop 7th': 7 / 4,
    };
    const etSemitones: { [key: string]: number } = {
      'Root': 0,
      'Major Third': 4,
      'Perfect Fifth': 7,
      'Dominant 7th': 10, // 12TET equivalent of a minor 7th interval from root
    };

    const data = Object.keys(justRatios).map((noteName, index) => {
      const justFreq = rootFreq * justRatios[noteName];

      // For ET freq, use 'Dominant 7th' semitones when calculating Barbershop 7th
      const etNoteName = noteName === 'Barbershop 7th' ? 'Dominant 7th' : noteName;
      const etFreq = rootFreq * Math.pow(2, etSemitones[etNoteName] / 12);

      return {
        name: noteName,
        justFreq: justFreq,
        etFreq: etFreq,
        y: 4 - index, // for plotting on y-axis to stack notes
      }
    });

    setComparisonData(data);
  }, []);

  const yTicks = comparisonData.map(d => ({ value: d.y, label: d.name })).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Just Intonation vs. Equal Temperament</CardTitle>
        <CardDescription>Comparing a Barbershop 7th chord (rooted at A4=440Hz) in two tuning systems.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert mb-6">
          <p>
            This chart shows the precise frequency of each note in a Barbershop 7th chord. The <span className="text-blue-500 font-semibold">blue circles</span> represent <strong>Just Intonation</strong>, where notes are tuned to simple integer ratios (e.g., 5:4). This creates perfectly aligned overtones and the "ring." The <span className="text-red-500 font-semibold">red triangles</span> represent <strong>12-Tone Equal Temperament (12TET)</strong>, the system used by pianos, which slightly adjusts each note to allow playing in any key.
          </p>
          <p>
            Notice the frequency differences. The Just-tuned Major Third and Barbershop Seventh are significantly flatter (lower in frequency) than their piano counterparts. This precise tuning is what allows Barbershop chords to "lock" in a way that is impossible on an even-tempered instrument.
          </p>
        </div>
        <div className="w-full h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="freq"
                name="Frequency"
                unit="Hz"
                domain={['dataMin - 10', 'dataMax + 10']}
                label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -10 }}
              //tickFormatter={(tick) => Math.round(tick)}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Note"
                domain={[0, 5]}
                tickFormatter={(tickValue) => yTicks.find(t => t.value === tickValue)?.label || ''}
                ticks={yTicks.map(t => t.value)}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: number, name: string) => [`${value.toFixed(2)} Hz`, name]}
              />
              <Legend />
              <Scatter name="Just Intonation" data={comparisonData.map(d => ({ freq: d.justFreq, y: d.y }))} fill="#3b82f6" shape="circle" />
              <Scatter name="Equal Temperament" data={comparisonData.map(d => ({ freq: d.etFreq, y: d.y }))} fill="#ef4444" shape="triangle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};


// --- Main App Component ---

function App() {
  return (
    <div className="container mx-auto p-4 font-sans bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">Barbershop Chord Analyzer</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Exploring Just Intonation and Harmonics</p>
      </header>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="time">Time Domain</TabsTrigger>
          <TabsTrigger value="frequency">Frequency Domain</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <SummaryContent />
        </TabsContent>

        <TabsContent value="time">
          <TimeDomainVisualizer />
        </TabsContent>

        <TabsContent value="frequency">
          <FrequencyDomainVisualizer />
        </TabsContent>

        <TabsContent value="comparison">
          <TemperamentComparisonVisualizer />
        </TabsContent>
      </Tabs>

      <footer className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
        Built with React, TypeScript, Recharts, and Tailwind CSS. Theory based on provided text.
      </footer>
    </div>
  );
}

// Export the main component
export default App;

