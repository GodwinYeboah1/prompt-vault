export type Prompt = {
  id: number;
  title: string;
  body: string;
  tags: string[] | null;
  favorite: boolean;
  created_at: string;
};
