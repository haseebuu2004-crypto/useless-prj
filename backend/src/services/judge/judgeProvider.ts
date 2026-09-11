import { JudgeInput, JudgeVerdict } from "./judgeTypes.js";

export interface JudgeProvider {
  name: string;
  evaluateCase(input: JudgeInput): Promise<JudgeVerdict>;
}
