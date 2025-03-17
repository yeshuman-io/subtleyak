import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type CreateWiperConnectorStepInput = {
  name?: false;
  code?: false;
  type?: false;
  media_url?: false;
  arms_ids?: string[];
};

export const createWiperConnectorStep = createStep(
  "create-wiper-connector-step",
  async (input: CreateWiperConnectorStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const wiperConnector = await wipersModuleService.createWiperConnectors(input);

    return new StepResponse(wiperConnector, wiperConnector.id);
  },
  async (id: string, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    await wipersModuleService.deleteWiperConnectors(id);
  }
);

type CreateWiperConnectorWorkflowInput = CreateWiperConnectorStepInput;

export const createWiperConnectorWorkflow = createWorkflow(
  "create-wiper-connector-workflow",
  (input: CreateWiperConnectorWorkflowInput) => {
    const wiperConnector = createWiperConnectorStep(input);

    return new WorkflowResponse(wiperConnector);
  }
); 