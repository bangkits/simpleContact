import React from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, Dimensions, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import {
  Appbar,
  List,
  Divider,
  Button,
  Dialog,
  TextInput,
  IconButton,
  Snackbar,
  Modal,
  Title,
  Subheading,
  Paragraph
} from 'react-native-paper';

import * as Constants from 'expo-constants'
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker'
import { createStackNavigator, createAppContainer, StackActions, NavigationActions } from "react-navigation";


const api = 'https://simple-contact-crud.herokuapp.com/contact'

const height = Dimensions.get("window").height;
const width = Dimensions.get("window").width;

class Splash extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Title>Welcome!</Title>
        <Subheading>rules :</Subheading>
        <Paragraph>1: Press contact to see contact detail and also edit of course</Paragraph>
        <Paragraph>2: Long Press contact delete contact</Paragraph>
        <Paragraph>Enjoy~</Paragraph>
        <Button mode="outlined" onPress={() => this.props.navigation.navigate('Index')}>
          Lets go
        </Button>
      </View>
    );
  }
}

class HomeScreen extends React.Component {

  state = {
    contactData: null,
    visible: false,
    limit: 10,
    refreshing: false,
    visibleDialog: false,
    image: null
  }

  componentDidMount = async () => {
    this.getContactData()

  }

  getContactData = () => {
    return fetch(api)
      .then(response => response.json())
      .then(responseJson => {
        this.setState(
          {
            contactData: responseJson.data
          }
        );
      })
      .catch(error => {
        console.error(error);
      });
  }

  _hideDialog = () => this.setState({ visibleDialog: false })
  _openMenu = () => this.setState({ visible: true });
  _closeMenu = () => this.setState({ visible: false });
  isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 10
    return layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
  }

  _onRefresh = () => {
    this.setState({ refreshing: true }, () => this._refresh());
  }

  _refresh() {
    this.setState({
      contactData: null,
      limit: 10,
      refreshing: false,
    }, () => { this.getContactData(); });
  }

  loadMoreData = () => {
    setTimeout(() => {
      this.setState({
        loadMore: false,
        limit: this.state.limit + 10
      })
    }, 500)
  }

  deleteContact = (id) => {
    const url = api + '/' + id;
    let data = {}
    return fetch(url, {
      method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
      .then(response =>
        response.status == 202 ? this.getContactData() : Alert.alert('Delete Error! - status server' + response.status)
      );
  }

  render() {
    return (
      <View>
        <Appbar.Header
          style={{ backgroundColor: 'white', elevation: 5 }}>
          <Appbar.Content
            title="Contact List"
          />
          <Appbar.Action icon="add" onPress={() => this.props.navigation.navigate('Add')} />
        </Appbar.Header>
        <ScrollView
          style={{ height: height }}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh}
            />}
          scrollEventThrottle={16}
          onMomentumScrollEnd={({ nativeEvent }) => {
            if (this.isCloseToBottom(nativeEvent) && this.state.contactData != null) {
              this.state.contactData.length > this.state.limit &&
                this.setState({ loadMore: true }, () => this.loadMoreData())
            }
          }}>
          {this.state.contactData != null &&
            <List.Section >
              {this.state.contactData.slice(0, this.state.limit).map((data, index) => {
                return (
                  <View key={index}>
                    <List.Item
                      title={data.firstName + ' ' + data.lastName}
                      description={'age : ' + data.age.toString() + ' years'}
                      onPress={() => this.props.navigation.navigate('Add', { id: data.id })}
                      onLongPress={() => Alert.alert(
                        'Delete Contact',
                        'Are you sure to delete this contact?',
                        [
                          {
                            text: 'Cancel',
                            style: 'cancel',
                          },
                          { text: 'OK', onPress: () => this.deleteContact(data.id) },
                        ],
                        { cancelable: false },
                      )}
                    />
                    <Divider />
                  </View>
                );
              })}
            </List.Section>
          }
          {this.state.contactData == null &&
            <ActivityIndicator size="large" color="black" style={{ marginTop: height * 0.4 }} />
          }
        </ScrollView>
      </View>
    );
  }
}

class AddContact extends React.Component {
  state = {
    firstName: '',
    lastName: '',
    age: '',
    photo: '',
    isEdit: false,
    id: null,
    visible: false,
    visibleModal: false
  }

  componentDidMount() {
    this.getPermissionAsync();
  }

  postData() {
    // Default options are marked with *
    this._showModal();
    const url = this.state.isEdit ? api + '/' + this.state.id : api;
    let data = {
      "firstName": this.state.firstName,
      "lastName": this.state.lastName,
      "age": parseInt(this.state.age),
      "photo": this.state.photo == '' ? 'N/A' : this.state.photo.base64 != undefined ? 'data:image/jpeg;base64,' + this.state.photo.base64 : this.state.photo.uri
    }

    return fetch(url, {
      method: this.state.isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response =>
        response.status == 201 ? this.setState({ visible: true }, () => this._hideModal()) : this.setState({ visibleModal: false }, () => Alert.alert('Submit Error' + response.status))
      );
  }

  getPermissionAsync = async () => {
    if (Constants.default.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  }

  _pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.cancelled) {
      this.setState({ photo: result });
    }
  };

  componentWillMount() {
    let navigation = this.props.navigation;
    if (navigation.getParam('id') != null) {
      this._showModal();
      return fetch(api + '/' + navigation.getParam('id'))
        .then(response => response.json())
        .then(responseJson => {
          this.setState(
            {
              firstName: responseJson.data.firstName,
              lastName: responseJson.data.lastName,
              age: responseJson.data.age.toString(),
              photo: responseJson.data.photo != 'N/A' ? { uri: responseJson.data.photo } : '',
              isEdit: true,
              id: navigation.getParam('id')
            }, () => this._hideModal()
          );
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  measureView(event) {
    this.setState({
      heightofView: event.nativeEvent.layout.height,
      widthofView: event.nativeEvent.layout.width
    });
  }

  resetNavigation = () => {
    const resetAction = StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: 'Index' })],
    });
    this.props.navigation.dispatch(resetAction);
  }

  _showModal = () => this.setState({ visibleModal: true });
  _hideModal = () => this.setState({ visibleModal: false });

  render() {
    return (
      <View style={{ height: height }}>
        <Modal
          dismissable={false}
          style={{ width: width, height: height }}
          visible={this.state.visibleModal}
          onDismiss={this._hideModal}>
        </Modal>
        <Snackbar
          visible={this.state.visible}
          onDismiss={() => this.setState({ visible: false }, () => this.resetNavigation())}
          duration={1000}>
          Submit Success
        </Snackbar>
        <Appbar.Header
          style={{ backgroundColor: 'white' }}>
          <Appbar.BackAction
            onPress={() => this.props.navigation.goBack()}
          />
          <Appbar.Content
            title="Detail Contact"
          />
        </Appbar.Header>
        <View style={{ padding: 30 }}>
          <TextInput
            focus
            style={{ marginVertical: 10, backgroundColor: 'white' }}
            mode='flat'
            label='First Name'
            value={this.state.firstName}

            onChangeText={text => this.setState({ firstName: text })}
          />
          <Divider />
          <TextInput
            style={{ marginVertical: 10, backgroundColor: 'white' }}
            mode='flat'
            label='Last Name'
            value={this.state.lastName}
            onChangeText={text => this.setState({ lastName: text })}
          />
          <Divider />
          <TextInput
            keyboardType='numeric'
            style={{ marginVertical: 10, backgroundColor: 'white' }}
            mode='flat'
            label='Age'
            value={this.state.age}
            onChangeText={text => this.setState({ age: text })}
          />
          <Divider />
        </View>
        {
          this.state.photo == '' &&
          <View onLayout={(event) => this.measureView(event)} style={{ backgroundColor: '#E3E3E3', height: 250, borderColor: 'grey', borderWidth: 1, borderRadius: 4, marginHorizontal: 30, justifyContent: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <IconButton
                icon="camera"
                color='#787878'
                size={30}
                onPress={() => this._pickImage()}
              />
            </View>
          </View>
        }
        {
          this.state.photo != '' &&
          <TouchableOpacity onPress={() => this._pickImage()} style={{ alignItems: 'center' }}>
            <Image style={{ width: this.state.widthofView, height: this.state.heightofView, resizeMode: 'contain' }} source={{ uri: this.state.photo.uri }} />
          </TouchableOpacity>
        }
        <View style={{ paddingHorizontal: 20, justifyContent: 'flex-end', marginVertical: 20 }}>
          <Button mode="outlined" onPress={() => this.postData()} color={'grey'}>
            Submit Contact</Button>
        </View>
      </View >
    );
  }
}


const AppNavigator = createStackNavigator({
  Splash: Splash,
  Index: HomeScreen,
  Add: AddContact
},
  {
    initialRouteName: "Splash",
    headerMode: "none"
  });

export default createAppContainer(AppNavigator);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 20,
    backgroundColor: '#f5f5f5',
    right: 0,
    bottom: 0,
  },
});
