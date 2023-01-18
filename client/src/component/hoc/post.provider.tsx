import React, { FC, useContext, useEffect } from 'react';
import { useTypeSelector } from '../../hooks/useTypeSelector';
import { fetchPost, createPost, removePost } from '../../redux/thunk/post.thunk';
import Load from '../styled/organism/Load';
import { useSearchParams } from 'react-router-dom';
import { IPostContext, IPostCreate, ReactChildren } from '../../types/components/post/post.type';
import { useAppDispatch } from '../../redux/actions/actions';

const Post = React.createContext<IPostContext | null>(null);

export function usePost() {
  const postContext = useContext(Post);
  if (!postContext) throw new Error('Unexpected error');
  return postContext;
}

export const PostProvider: FC<ReactChildren> = ({ children }) => {
  const { isLoading, post, count } = useTypeSelector((state) => state.post);
  const [searchParams] = useSearchParams();
  const { id } = useTypeSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const postCreate = async (body: IPostCreate) => {
    dispatch(createPost(body));
  };
  const postRemove = async (id: string) => {
    dispatch(removePost(id));
  };
  const postFetch = async (page = '0') => {
    dispatch(fetchPost(Number(page) * 25));
  };

  useEffect(() => {
    postFetch(searchParams.get('page') || '0');
  }, [searchParams.get('page')]);
  return (
    <Post.Provider
      value={{
        post,
        postCreate,
        postRemove,
        postFetch,
        id,
        isLoading,
        count,
      }}
    >
      {isLoading ? <Load /> : children}
    </Post.Provider>
  );
};
