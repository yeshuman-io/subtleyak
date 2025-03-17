import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type UpdateWiperKitStepInput = {
  id: string;
  name?: false;
  code?: false;
  wiper_ids?: string[];
};

export const updateWiperKitStep = createStep(
  "update-wiper-kit-step",
  async (input: UpdateWiperKitStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const wiperKit = await wipersModuleService.updateWiperKits(input);

    return new StepResponse(wiperKit, wiperKit.id);
  },
  async (id: string, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateWiperKitWorkflowInput = {
  id: string;
  name?: false;
  code?: false;
  wiper_ids?: string[];
};

export const updateWiperKitWorkflow = createWorkflow(
  "update-wiper-kit-workflow",
  (input: UpdateWiperKitWorkflowInput) => {
    const wiperKit = updateWiperKitStep(input);

    return new WorkflowResponse(wiperKit);
  }
);