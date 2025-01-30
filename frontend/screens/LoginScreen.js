
import React, { useState } from 'react'
import { Button ,TextInput} from 'react-native-paper'
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native'
import {baseURL} from './../apis/index'
import AsyncStorage from '@react-native-community/async-storage'
import { Formik } from 'formik'
import * as yup from 'yup'

const loginValidationSchema = yup.object().shape({
  email: yup
    .string()
    .email("El. paštas turi atitikti reikalavimus")
    .required('El. paštas yra privalomas'),
  password: yup
    .string()
    .min(8, ({ min }) => `Slaptažodis turi būti bent ${min} simbolių ilgio`)
    .required('Slaptažodis yra privalomas'),
})

const LoginScreen = (props) => {
  const [error, setError] = useState()
    
  const sendCred = async (props, values)=>{
    fetch(`${baseURL}/login`,{
      method:"POST",
      headers: {
       'Content-Type': 'application/json'
     },
     body:JSON.stringify({
       "email":values.email,
       "password":values.password
     })
    })
    .then(res=>res.json())
    .then(async (data)=>{
           try {
             setError(data.msg)
             console.log("login data", data.user.email)
             await AsyncStorage.setItem('email',data.user.email)
             await AsyncStorage.setItem('token',data.token)
             props.navigation.replace("home")
           } catch (e) {
             console.log("error hai",e)
           }
    })
 }

  return (
   <> 
   <KeyboardAvoidingView behavior="position">
     <StatusBar backgroundColor="blue" barStyle="light-content" />
      <Text 
      style={{fontSize:35,marginLeft:18,marginTop:10,color:"#3b3b3b"}}>Kambarinių Augalų</Text>
      <Text 
      style={{fontSize:30,marginLeft:18,color:"blue"}}
      >Šiltnamis</Text>
      <View
      style={{
        borderBottomColor:"blue",
        borderBottomWidth:4,
        borderRadius:10,
        marginLeft:20,
        marginRight:150,
        marginTop:4
      }}
       />
      <Text
      style={{
        fontSize:20,marginLeft:18,marginTop:20
      }}
      
      > Prisijungti su el. paštu</Text>
      <Formik
            validateOnMount={true}
            validationSchema={loginValidationSchema}
            initialValues={{ email: '', password: '' }}
            onSubmit={values => sendCred(props, values)}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isValid,
            }) => (
              <>
                <TextInput
                  label='El. paštas'
                  mode="outlined"
                  name="email"
                  placeholder="Email Address"
                  style={{marginLeft:18,marginRight:18,marginTop:18}}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                  theme={{colors:{primary:"blue"}}}
                  keyboardType="email-address"
                />
                {(errors.email && touched.email) &&
                  <Text style={{fontSize:14,marginLeft:18,color:"red"}}>{errors.email}</Text>
                }
                <TextInput
                  label='Slaptažodis '
                  mode="outlined"
                  name="password"
                  placeholder="Password"
                  style={{marginLeft:18,marginRight:18,marginTop:18}}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  theme={{colors:{primary:"blue"}}}
                  value={values.password}
                  secureTextEntry
                />
                {(errors.password && touched.password) &&
                  <Text style={{fontSize:14,marginLeft:18,color:"red"}}>{errors.password}</Text>
                }
                <Button 
                  mode="contained"
                  style={{marginLeft:18,marginRight:18,marginTop:18}}
                  onPress={() => handleSubmit()}
                  disabled={!isValid || values.email === ''}
                  >
                  Prisijungti
                </Button>
                <Text style={{fontSize:16,marginLeft:18,color:"red"}}>{error}</Text>
              </>
            )}
          </Formik>
      <TouchableOpacity>
        <Text
      style={{
        fontSize:18,marginLeft:18,marginTop:20
      }}
      onPress={()=>props.navigation.replace("signup")}
      >neturite paskyros ?</Text>
      </TouchableOpacity>
      </KeyboardAvoidingView>
   </>
  )
}

export default LoginScreen
