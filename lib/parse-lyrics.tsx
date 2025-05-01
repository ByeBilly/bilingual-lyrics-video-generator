interface LyricPair {
  englishText: string;
  translatedText: string;
  startTime: number;
  endTime: number;
}

export function parseLyrics(lyricsText: string, audioAnalysis?: { beats: number[], duration: number }): LyricPair[] {
  // Split the lyrics into lines
  const lines = lyricsText.split("\n").filter(line => line.trim() !== "");
  
  // Extract section markers and clean lines
  const sections: { title: string, startIndex: number }[] = [];
  const cleanedLines: string[] = [];
  
  lines.forEach((line, index) => {
    const sectionMatch = line.match(/\[(.*?)\]/);
    if (sectionMatch) {
      sections.push({
        title: sectionMatch[1],
        startIndex: cleanedLines.length
      });
      // Add the line without the section marker
      const cleanLine = line.replace(/\[.*?\]/g, "").trim();
      if (cleanLine) {
        cleanedLines.push(cleanLine);
      }
    } else {
      cleanedLines.push(line.trim());
    }
  });
  
  // Group lines into pairs (English and translated)
  const pairs: LyricPair[] = [];
  
  for (let i = 0; i < cleanedLines.length; i += 2) {
    if (i + 1 < cleanedLines.length) {
      const englishLine = cleanedLines[i];
      const translatedLine = cleanedLines[i + 1];
      
      if (englishLine && translatedLine) {
        pairs.push({
          englishText: englishLine,
          translatedText: translatedLine,
          startTime: 0, // Will be calculated later
          endTime: 0    // Will be calculated later
        });
      }
    }
  }
  
  // Assign timing based on audio analysis if available
  if (audioAnalysis && audioAnalysis.beats.length > 0) {
    assignTimingWithBeats(pairs, audioAnalysis.beats, audioAnalysis.duration, sections);
  } else {
    // Fallback to even distribution if no audio analysis
    const estimatedDuration = 180; // 3 minutes in seconds (placeholder)
    const timePerPair = estimatedDuration / pairs.length;
    
    pairs.forEach((pair, index) => {
      pair.startTime = index * timePerPair;
      pair.endTime = (index + 1) * timePerPair;
    });
  }
  
  return pairs;
}

function assignTimingWithBeats(
  pairs: LyricPair[], 
  beats: number[], 
  duration: number,
  sections: { title: string, startIndex: number }[]
) {
  // If we have fewer beats than pairs, we need to interpolate
  if (beats.length < pairs.length * 2) {
    // Create more timing points by interpolating between beats
    const expandedBeats = interpolateBeats(beats, pairs.length * 2, duration);
    assignTimingToLyrics(pairs, expandedBeats);
  } else {
    // Use section information to better distribute beats
    if (sections.length > 0) {
      assignTimingWithSections(pairs, beats, duration, sections);
    } else {
      // We have enough beats, assign directly
      assignTimingToLyrics(pairs, beats);
    }
  }
  
  // Ensure the last pair ends at the song duration
  if (pairs.length > 0) {
    pairs[pairs.length - 1].endTime = duration;
  }
}

function assignTimingToLyrics(pairs: LyricPair[], timePoints: number[]) {
  // Assign two time points per lyric pair (start and end)
  for (let i = 0; i < pairs.length; i++) {
    const startIndex = i * 2;
    const endIndex = startIndex + 1;
    
    if (startIndex < timePoints.length) {
      pairs[i].startTime = timePoints[startIndex];
    }
    
    if (endIndex < timePoints.length) {
      pairs[i].endTime = timePoints[endIndex];
    } else if (i < pairs.length - 1) {
      // If we're missing an end time but not at the last pair,
      // use the next pair's start time
      pairs[i].endTime = pairs[i + 1].startTime;
    }
  }
}

function interpolateBeats(beats: number[], targetCount: number, duration: number): number[] {
  if (beats.length === 0) {
    // If no beats detected, distribute evenly
    const result: number[] = [];
    const interval = duration / targetCount;
    
    for (let i = 0; i < targetCount; i++) {
      result.push(i * interval);
    }
    
    return result;
  }
  
  if (beats.length >= targetCount) {
    // If we already have enough beats, return a subset
    const step = Math.floor(beats.length / targetCount);
    const result: number[] = [];
    
    for (let i = 0; i < targetCount; i++) {
      result.push(beats[Math.min(i * step, beats.length - 1)]);
    }
    
    return result;
  }
  
  // We need to interpolate to create more time points
  const result: number[] = [...beats];
  
  // Add the start time if it's not already there
  if (result[0] > 0.1) {
    result.unshift(0);
  }
  
  // Add the end time if it's not already there
  if (result[result.length - 1] < duration - 0.1) {
    result.push(duration);
  }
  
  // Keep interpolating until we have enough points
  while (result.length < targetCount) {
    const newPoints: number[] = [];
    
    // Add a point between each existing pair of points
    for (let i = 0; i < result.length - 1; i++) {
      const midpoint = (result[i] + result[i + 1]) / 2;
      newPoints.push(midpoint);
    }
    
    // Merge the new points with the existing ones
    for (let i = 0; i < newPoints.length; i++) {
      result.splice(i * 2 + 1, 0, newPoints[i]);
      
      // Stop if we've reached the target count
      if (result.length >= targetCount) {
        break;
      }
    }
    
    // Avoid infinite loops if we can't add enough points
    if (newPoints.length === 0) {
      break;
    }
  }
  
  // Sort and return the first targetCount points
  return result.sort((a, b) => a - b).slice(0, targetCount);
}

function assignTimingWithSections(
  pairs: LyricPair[], 
  beats: number[], 
  duration: number,
  sections: { title: string, startIndex: number }[]
) {
  // Add the end marker for the last section
  sections.push({
    title: "End",
    startIndex: pairs.length
  });
  
  // Distribute beats among sections based on the number of lyric pairs in each section
  for (let i = 0; i < sections.length - 1; i++) {
    const sectionStart = sections[i].startIndex;
    const sectionEnd = sections[i + 1].startIndex;
    const pairsInSection = sectionEnd - sectionStart;
    
    // Calculate how many beats to allocate to this section
    const totalBeats = beats.length;
    const beatsPerSection = Math.floor(totalBeats * (pairsInSection / pairs.length));
    
    // Find the appropriate beats for this section
    const sectionBeats = beats.slice(0, beatsPerSection * 2);
    beats = beats.slice(beatsPerSection * 2);
    
    // Assign timing to the pairs in this section
    const sectionPairs = pairs.slice(sectionStart, sectionEnd);
    assignTimingToLyrics(sectionPairs, sectionBeats);
    
    // If we've run out of beats, interpolate for the remaining sections
    if (beats.length === 0 && i < sections.length - 2) {
      const remainingPairs = pairs.slice(sectionEnd);
      const remainingDuration = duration - (sectionPairs.length > 0 ? sectionPairs[sectionPairs.length - 1].endTime : 0);
      
      // Distribute the remaining time evenly
      const timePerPair = remainingDuration / remainingPairs.length;
      let currentTime = pairs[sectionEnd - 1]?.endTime || 0;
      
      remainingPairs.forEach(pair => {
        pair.startTime = currentTime;
        currentTime += timePerPair;
        pair.endTime = currentTime;
      });
      
      break;
    }
  }
}
