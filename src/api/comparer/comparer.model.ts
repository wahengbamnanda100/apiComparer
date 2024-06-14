import * as z from "zod";
import { collectionName, db } from "../../db";
import { WithId } from "mongodb";

export const Compare = z.object({
	uid: z.string().min(4),
	compare_md: z.string(),
});

// export const CompareYaml = z.array(
// 	z.object({
// 		name: z.string(),
// 		yaml: z.string(),
// 	})
// );

export const CompareYaml = z.object({
	uid: z.string(),
	orgYaml: z.string(),
	apiYaml: z.string(),
});

export type Compare = z.infer<typeof Compare>;
export type CompareYamlType = z.infer<typeof CompareYaml>;
export type CompareWithId = WithId<Compare>;

export const CompareApi = db.collection<Compare>(collectionName);
