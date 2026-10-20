import { useEffect, useState } from 'react';
import { message } from 'antd';
import { callFetchSkillsWithoutPaginate } from '../api';

export interface SkillCatalogOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export const useSkillCatalog = (enabled: boolean) => {
  const [options, setOptions] = useState<SkillCatalogOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;

    const loadCatalog = async () => {
      setLoading(true);

      try {
        const response = await callFetchSkillsWithoutPaginate();
        const skills = response?.data?.result ?? [];

        if (active) {
          setOptions(
            skills
              .filter((skill) => !skill.isDeleted)
              .map((skill) => ({ value: skill.id, label: skill.name }))
              .sort((left, right) =>
                left.label.localeCompare(right.label, 'vi'),
              ),
          );
        }
      } catch {
        if (active) {
          setOptions([]);
          message.error('Không thể tải danh mục kỹ năng thực.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      active = false;
    };
  }, [enabled]);

  return { options, loading };
};
