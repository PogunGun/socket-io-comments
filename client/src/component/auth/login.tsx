import { WrapperAuth } from '../styled/atom/Main';
import { TextField } from '../styled/atom/Input';
import { ErrorMessage } from '../styled/atom/Error';
import { LinkParagraph } from '../styled/atom/Text';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTypeSelector } from '../../hooks/useTypeSelector';
import { FC } from 'react';
import { emailValidation, requireString } from '../../config/customValidation/validation';
import { Button } from '../styled/atom/Button';
import ReCAPTCHA from 'react-google-recaptcha';
import { Form, Text, Block } from '../../page/auth.page';
import { useNavigate } from 'react-router-dom';
import { signin } from '../../redux/thunk/auth.thunk';
import styled from 'styled-components';
import { useAppDispatch } from '../../redux/actions/actions';
import { IRegistration } from '../../types/components/auth/auth.type';

interface IFormInputs {
  email: string;
  password: string;
}

const Container = styled.div`
  margin-top: 1rem;
`;

export const Login: FC<IRegistration> = ({ toggle, setToggle }) => {
  const theme = useTypeSelector((state) => state.theme.themes);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInputs>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const Login = async (form: IFormInputs) => {
    await dispatch(signin({ email: form.email, password: form.password }));
    if (localStorage.getItem('authToken')) {
      navigate('/');
    }
  };

  function onChange(value: string | null) {
    if (value) {
      localStorage.setItem('authCapthca', value);
    }
  }

  return (
    <WrapperAuth>
      <Block>
        <Form onSubmit={handleSubmit(Login)}>
          <Text>Log in</Text>
          <Container>
            <TextField validation={register('email', emailValidation)} placeholder="Email" />
            {errors.email && <ErrorMessage error={errors.email?.message}></ErrorMessage>}
            <TextField
              validation={register('password', requireString)}
              type="password"
              placeholder="Password"
            />
            {errors.password && <ErrorMessage error={errors.password?.message}></ErrorMessage>}
            <ReCAPTCHA
              onChange={onChange}
              sitekey="6LeuvdIjAAAAAAJxcuFahurWn_QvvYcHJeUY_0Ff"
              theme={theme}
            />
            <Button>Continue</Button>
          </Container>
        </Form>
        {!toggle && <LinkParagraph onClick={() => setToggle(true)}>Registration</LinkParagraph>}
      </Block>
    </WrapperAuth>
  );
};
