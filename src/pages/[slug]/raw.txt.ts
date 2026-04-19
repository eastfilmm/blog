import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
	const posts = await getCollection('blog');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { post },
	}));
};

export const GET: APIRoute = ({ props, site }) => {
	const post = props.post as CollectionEntry<'blog'>;
	const canonical = new URL(
		`${import.meta.env.BASE_URL}/${post.id}/`,
		site,
	).toString();
	const text = `아래는 "${post.data.title}" 글 전문입니다. 이 글을 읽고 사용자의 질문에 답하거나, 요청받은 방식으로 요약해주세요. (출처: ${canonical})

---

${post.body ?? ''}`;
	return new Response(text, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
