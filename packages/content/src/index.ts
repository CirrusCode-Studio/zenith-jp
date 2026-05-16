import { lesson1Vocab } from './jp/vocabs/lesson1.vocab';
import { lesson8Vocab } from './jp/vocabs/lesson8.vocab';
import { Lesson1 } from './jp/lessons/lesson1';
import { Lesson8 } from './jp/lessons/lesson8';
import { Lesson1Cluster } from './jp/clusters/lesson1.cluster';
import { Lesson8Cluster } from './jp/clusters/lesson8.cluster';

export const VOCABULARY_CLUSTERS = [...Lesson1Cluster, ...Lesson8Cluster];
export const LESSON_DATA = [Lesson1, Lesson8];
export const VOCABULARY_DATA = [...lesson1Vocab, ...lesson8Vocab];