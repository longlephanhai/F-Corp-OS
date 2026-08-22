import { TitleType } from '../enum/user.enum';
export const TITLE_COST_RATE: Record<TitleType, number> = {
  [TitleType.JUNIOR_DEV]: 1.0,
  [TitleType.SENIOR_DEV]: 1.8,
  [TitleType.PM]: 2.0,
  [TitleType.HR]: 1.2,
};
