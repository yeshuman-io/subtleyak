import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type CreateWiperArmStepInput = {
  name?: false;
  code?: false;
  connector_ids?: string[];
};

export const createWiperArmStep = createStep(
  "create-wiper-arm-step",
  async (input: CreateWiperArmStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const wiperArm = await wipersModuleService.createWiperArms(input);

    return new StepResponse(wiperArm, wiperArm.id);
  },
  async (id: string, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    await wipersModuleService.deleteWiperArms(id);
  }
);

type CreateWiperArmWorkflowInput = CreateWiperArmStepInput;

export const createWiperArmWorkflow = createWorkflow(
  "create-wiper-arm-workflow",
  (input: CreateWiperArmWorkflowInput) => {
    const wiperArm = createWiperArmStep(input);

    return new WorkflowResponse(wiperArm);
  }
); 