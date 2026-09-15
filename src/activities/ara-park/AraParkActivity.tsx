import { useState } from 'react';
import { AraParkEntry } from './AraParkEntry';
import { AraParkUnityHost } from './AraParkUnityHost';

export function AraParkActivity() {
  const [entered, setEntered] = useState(false);

  if (!entered) {
    return <AraParkEntry onEnter={() => setEntered(true)} />;
  }

  return <AraParkUnityHost />;
}
