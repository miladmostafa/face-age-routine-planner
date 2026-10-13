declare module "face-age" {
  export type FaceAgeDisplayModel = "widget" | "section" | "modal";

  export interface FaceAgeOptions {
    elementId: string;
    faceageId: string;
    displayModel: FaceAgeDisplayModel;
    language?: string;
    height?: string;
    quiz?: boolean;
    history?: boolean;
    showProducts?: boolean;
    showRoutine?: boolean;
    showAddToCard?: boolean;
    showAddToCardAll?: boolean;
    routinesSupport?: string[];
    showEmptyRoutines?: boolean;
    problems?: string[];
    showCamera?: boolean;
    showUpload?: boolean;
  }

  export interface RoutineGroupInfo {
    key: string;
    title: string;
    status: string[];
  }

  export interface CustomProduct {
    id: number;
    url: string;
    image: string;
    title: string;
    description?: string;
    price: number;
    problems?: string[];
    routineGroups?: string[] | Record<string, string[]>;
  }

  export interface FaceAgeAPI {
    getAdvisorData(callback: (data: unknown) => void): Promise<unknown>;
    getRoutineGroup(): RoutineGroupInfo[] | null;
    setCustomProducts(products: CustomProduct[]): void;
    getImage(): string | null;
  }

  export default class FaceAge {
    constructor(options: FaceAgeOptions);
    render(): Promise<unknown>;
    API: FaceAgeAPI;
    onDisplayRoutines(callback: (data: unknown) => void): Promise<unknown>;
    onDisplayProducts(callback: (data: unknown) => void): Promise<unknown>;
    onResetData(callback: () => void): Promise<unknown>;
  }
}
