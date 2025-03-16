import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type UpdateWiperConnectorStepInput = {
  id: string;
  name?: false;
  code?: false;
  type?: false;
  media_url?: false;
  arms_ids?: string[];
};

export const updateWiperConnectorStep = createStep(
  "update-wiper-connector-step",
  async (input: UpdateWiperConnectorStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const wiperConnector = await wipersModuleService.updateWiperConnectors(input);

    return new StepResponse(wiperConnector, wiperConnector.id);
  },
  async (id: string, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateWiperConnectorWorkflowInput = {
  id: string;
  name?: false;
  code?: false;
  type?: false;
  media_url?: false;
  arms_ids?: string[];
};

export const updateWiperConnectorWorkflow = createWorkflow(
  "update-wiper-connector-workflow",
  (input: UpdateWiperConnectorWorkflowInput) => {
    const wiperConnector = updateWiperConnectorStep(input);

    return new WorkflowResponse(wiperConnector);
  }
);