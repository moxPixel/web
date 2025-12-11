export interface CreateModuleDto {
  trainingId: string;
  title: string;
  durationHours?: number;
  topics?: string[];
  order?: number;
}

export interface UpdateModuleDto extends Partial<CreateModuleDto> {}

