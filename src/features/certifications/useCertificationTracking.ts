import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learnerKeys } from '@/data/queries';
import type { CertificationProgressRecord } from '@/data/records';
import { useRepository } from '@/data/useRepository';

/** Saving and removing the learner's plan for a certification. */
export function useCertificationTracking() {
  const repository = useRepository();
  const client = useQueryClient();

  const save = useMutation({
    mutationFn: async (record: CertificationProgressRecord) => {
      const saved = { ...record, updatedAt: new Date().toISOString() };
      await repository.saveCertificationProgress(saved);
      return saved;
    },
    onSuccess: (saved) =>
      client.setQueryData<CertificationProgressRecord[]>(learnerKeys.certifications, (current) =>
        current ? [...current.filter((record) => record.certId !== saved.certId), saved] : [saved],
      ),
  });

  const remove = useMutation({
    mutationFn: (certId: string) => repository.deleteCertificationProgress(certId),
    onSuccess: () => client.invalidateQueries({ queryKey: learnerKeys.certifications }),
  });

  return { save, remove };
}
