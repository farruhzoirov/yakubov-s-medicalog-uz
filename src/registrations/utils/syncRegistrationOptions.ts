import { Model } from 'mongoose';
import type { RegistrationOptionDocument } from '../schemas/registration-option.schema';
import { RegistrationOptionTypeEnum } from 'src/type/enums/options.enum';

export type RegistrationDiagnosisPayload = {
  preOperationDiagnosis?: string;
  operationName?: string;
  postOperationDiagnosis?: string;
};

/**
 * Ensures each non-empty diagnosis/operation label exists in RegistrationOption.
 * Reusable for create and update registration flows.
 */
export async function syncRegistrationOptions(
  registrationOptionModel: Model<RegistrationOptionDocument>,
  payload: RegistrationDiagnosisPayload,
): Promise<void> {
  const pairs: { type: RegistrationOptionTypeEnum; value: string }[] = [];

  if (payload.preOperationDiagnosis?.trim()) {
    pairs.push({
      type: RegistrationOptionTypeEnum.preOperationDiagnosis,
      value: payload.preOperationDiagnosis.trim(),
    });
  }
  if (payload.operationName?.trim()) {
    pairs.push({
      type: RegistrationOptionTypeEnum.operationName,
      value: payload.operationName.trim(),
    });
  }
  if (payload.postOperationDiagnosis?.trim()) {
    pairs.push({
      type: RegistrationOptionTypeEnum.postOperationDiagnosis,
      value: payload.postOperationDiagnosis.trim(),
    });
  }

  for (const { type, value } of pairs) {
    const existing = await registrationOptionModel
      .findOne({ type, label: value })
      .exec();
    if (!existing) {
      await registrationOptionModel.create({ type, label: value });
    }
  }
}
