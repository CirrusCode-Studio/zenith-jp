import { lesson1Vocab } from './jp/vocabs/lesson1.vocab';
import { lesson8Vocab } from './jp/vocabs/lesson8.vocab';
import { lesson10Vocab } from './jp/vocabs/lesson10.vocab';
import { lesson15Vocab } from './jp/vocabs/lesson15.vocab';

import { Lesson1 } from './jp/lessons/lesson1';
import { Lesson8 } from './jp/lessons/lesson8';
import { Lesson10 } from './jp/lessons/lesson10';
import { Lesson15 } from './jp/lessons/lesson15';

import { Lesson1Cluster } from './jp/clusters/lesson1.cluster';
import { Lesson8Cluster } from './jp/clusters/lesson8.cluster';
import { Lesson10Cluster } from './jp/clusters/lesson10.cluster';
import { Lesson15Cluster } from './jp/clusters/lesson15.cluter';

export const VOCABULARY_CLUSTERS = [
    ...Lesson1Cluster, 
    ...Lesson8Cluster, 
    ...Lesson10Cluster,
    ...Lesson15Cluster
];
export const LESSON_DATA = [Lesson1, Lesson8, Lesson10, Lesson15];
export const VOCABULARY_DATA = [...lesson1Vocab, ...lesson8Vocab, ...lesson10Vocab, ...lesson15Vocab];