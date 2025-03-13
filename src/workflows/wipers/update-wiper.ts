import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type UpdateWiperStepInput = {
  id: string;
  name?: false;
  code?: false;
  kits_ids?: string[];
};

export const updateWiperStep = createStep(
  "update-wiper-step",
  async (input: UpdateWiperStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const wiper = await wipersModuleService.updateWipers(input);

    return new StepResponse(wiper, wiper.id);
  },
  async (id: string, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateWiperWorkflowInput = {
  id: string;
  name?: false;
  code?: false;
  kits_ids?: string[];
};

export const updateWiperWorkflow = createWorkflow(
  "update-wiper-workflow",
  (input: UpdateWiperWorkflowInput) => {
    const wiper = updateWiperStep(input);

    return new WorkflowResponse(wiper);
  }
);