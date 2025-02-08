import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type UpdateWiperArmStepInput = {
  id: string;
  name?: false;
  code?: false;
  connector_ids?: string[];
};

export const updateWiperArmStep = createStep(
  "update-wiper-arm-step",
  async (input: UpdateWiperArmStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const wiperArm = await wipersModuleService.updateWiperArms(input);

    return new StepResponse(wiperArm, wiperArm.id);
  },
  async (id: string, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateWiperArmWorkflowInput = {
  id: string;
  name?: false;
  code?: false;
  connector_ids?: string[];
};

export const updateWiperArmWorkflow = createWorkflow(
  "update-wiper-arm-workflow",
  (input: UpdateWiperArmWorkflowInput) => {
    const wiperArm = updateWiperArmStep(input);

    return new WorkflowResponse(wiperArm);
  }
);