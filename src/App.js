import React, { Component } from 'react';
import { config } from './firebase-credentials';
import firebase from 'firebase/app';
import "firebase/auth";
import "firebase/firestore";
import { Header, Confirm, Message, Button, Icon, Modal, Divider, Input, Label, Container, Dropdown, List, Dimmer, Loader, Menu } from 'semantic-ui-react';
import ListItemContent from './ListItemContent';
import Level from './Level';
import "./App.css";
export default class App extends Component {
  constructor(props) {
    super(props);
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    this.auth = firebase.auth();
    this.db = firebase.firestore();

    this.debug = (process.env.REACT_APP_DEBUG) ? process.env.REACT_APP_DEBUG : false;

    this.statues = [
      { key: 's0', text: 'empty', value: 0 },
      { key: 's1', text: 'low', value: 1 },
      { key: 's2', text: 'enough', value: 2 },
      { key: 's3', text: 'ok', value: 3 },
      { key: 's4', text: 'full', value: 4 },
    ]

    this.orderedBy = [
      { key: 'o0', text: 'level high to low', value: 'desc' },
      { key: 'o1', text: 'level low to high', value: 'asc' }
    ]

    this.state = {
      content: 'loading',
      loginError: '',
      defaultStatus: [0,1,2,3,4],
      defaultCat: 'all',
      defaultOrder: 'asc',
      stuff: {},
      openModal: false,
      //stuffcats: [{key: 'all', text: 'all', value: 'all' }],
      searchStuff: '',
      newStuffName: '',
      newStuffError: false,
      newCatName: '',
      openDeleteConfirm: false,
      newLevel: 3
    };

    this.stuffToDelete = null;

    this.signInWithGoogle = this.signInWithGoogle.bind(this);
    this.getStuff = this.getStuff.bind(this);
    this.editStuffStatus = this.editStuffStatus.bind(this);
    this.searchFilterStuff = this.searchFilterStuff.bind(this);
    this.addNewStuff = this.addNewStuff.bind(this);
    this.deleteConfirm = this.deleteConfirm.bind(this);
    //this.getStuffCats = this.getStuffCats.bind(this);
  }

  componentDidMount() {   
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        if(this.debug) console.log(user);
        this.getStuff();
      } else {
        this.setState({content: 'login'});
      }
    });
  }

  signInWithGoogle() {
    this.setState({content: 'loading'});
    this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
      let provider = new firebase.auth.GoogleAuthProvider();
      this.auth.signInWithPopup(provider).then((result) => {
        if(this.debug) console.log(result.user);
      }).catch((error) => {
        console.log(error.code);
        this.setState({content: 'login'});
      });
    })
    .catch((error) => {
      console.log(error.code);
      console.log(error.message);
      this.setState({content: 'login'});
    });
  }

  getStuff(status = this.state.defaultStatus, cat = 'all', order = this.state.defaultOrder) {

    this.db.collection("stuff").where("status", "in", status).get().then((qs) => {
      let data = {}, stuff = {};
      qs.forEach((doc) => {
        if(cat !== 'all'){
          let stuffDoc = doc.data()
          if(cat === stuffDoc.cat) data[doc.id] = stuffDoc;
        } else {
          data[doc.id] = doc.data();
        }
      });
      if(order === 'asc'){
        Object.keys(data).sort(function(a, b){
          return data[a].status - data[b].status;
        }).forEach(function(key) {
          stuff[key] = data[key];
        });
      } else {
        Object.keys(data).sort(function(a, b){
          return data[b].status - data[a].status;
        }).forEach(function(key) {
          stuff[key] = data[key];
        });
      }
      if(this.state.searchStuff.length > 0){
        for (var k in stuff) {
          if (stuff[k].name.toLowerCase().includes(this.state.searchStuff.toLowerCase())) {
            var regEx = new RegExp(this.state.searchStuff, "ig");
            stuff[k].searchName = stuff[k].name.replace(regEx, `<mark class="search-text">${this.state.searchStuff}</mark>`);
            stuff[k].disabled = false;
          } else {
            delete stuff[k].searchName;
            stuff[k].disabled = true;
          }
        }
      }
      this.setState({stuff, content: 'stuff', defaultStatus: status, defaultOrder: order, loginError: ''});
    }).catch((e) => {
      if(e.code === 'permission-denied'){
        this.setState({content: 'login', loginError: 'This user is unauthorized'});
      } else {
        console.log( e.code );
        console.log( e );
      }
    });
  }

  // getStuffCats() {
  //   this.db.collection("stuffcats").get().then((qs) => {
  //     let stuffcats = [...this.state.stuffcats];
  //     qs.forEach((doc) => {
  //       stuffcats.push({key: doc.id, text: doc.id, value: doc.id});
  //     });
  //     this.setState({stuffcats});
  //   });
  // }

  editStuffStatus(stuffid, status) {
    this.db.collection("stuff").doc(stuffid).update({status});
  }

  searchFilterStuff(s){
    let stuff = this.state.stuff;
    for (var k in stuff) {
      if (stuff[k].name.toLowerCase().includes(s.toLowerCase())) {
        var regEx = new RegExp(s, "ig");
        stuff[k].searchName = stuff[k].name.replace(regEx, `<mark class="search-text">${s}</mark>`);
        stuff[k].disabled = false;
      } else {
        delete stuff[k].searchName;
        stuff[k].disabled = true;
      }
      this.setState({stuff, searchStuff: s});
    }
  }

  addNewStuff(){
    this.setState({newStuffLoading: true, newStuffError: false});
    let existing = false;
    for (var k in this.state.stuff) {
      if (this.state.stuff[k].name.toLowerCase() === this.state.newStuffName.toLowerCase()) {
        existing = true;
      }
    }
    if(existing){
      this.setState({newStuffLoading: false, newStuffError: true});
    } else {
      // if(!(this.state.stuffcats.some(e => e.value === this.state.newCatName))){
      //   this.db.collection("stuffcats").doc(this.state.newCatName);
      //   let newCats = [...this.state.stuffcats];
      //   newCats.push({key: this.state.newCatName, text: this.state.newCatName, value: this.state.newCatName });
      //   this.setState({
      //     stuffcats: newCats
      //   });
      // }
      let newStuff = {...this.state.stuff};
      this.db.collection("stuff").add({
        name: this.state.newStuffName,
        cat: this.state.newCatName,
        status: this.state.newLevel
      }).then((d) => {
        console.log("Document written with ID: ", d.id);
        newStuff[d.id] = {
          name: this.state.newStuffName,
          cat: this.state.newCatName,
          status: this.state.newLevel
        }
        this.setState({
          newStuffLoading: false, 
          openModal: false,
          stuff: newStuff,
          newStuffName: '', 
          newCatName: '', newLevel: 3
        });
      });
    }
  }

  onLongPress(stuffid){
    this.stuffToDelete = stuffid;
    this.setState({openDeleteConfirm: true});
  };

  deleteConfirm(d = false){
    if (!d) {
      this.setState({openDeleteConfirm: false});
      return;
    } else {
      this.db.collection("stuff").doc(this.stuffToDelete).delete();
      let newStuff = {...this.state.stuff};
      delete newStuff[this.stuffToDelete];
      this.setState({
        stuff: newStuff,
        openDeleteConfirm: false
      });
    }
  };

  render() {
    let screen;

    switch(this.state.content){
      case 'loading':
        screen = <Dimmer active inverted><Loader inverted content='Loading' /></Dimmer>;
      break;
      case 'stuff':
        screen = <>
        <Menu className="fixed top" size='large' borderless>
          <Menu.Item header>Coinquilini Stuff</Menu.Item>
          <Menu.Menu position='right'>
            <Input icon='search' size='mini' className="transparent" placeholder='Search...' onChange={(e, data) => this.searchFilterStuff(data.value)}/>
            <Dropdown icon='filter' item>
              <Dropdown.Menu>
                <Dropdown.Header icon='filter' content="Filter levels" />
                <Dropdown.Divider />
                {this.statues.map((st, i) => {
                  return <Dropdown.Item icon={(this.state.defaultStatus.indexOf(st.value) > -1) ? 'check square' : 'square outline'} key={st.key} content={st.text} onClick={() => {
                    let nst = this.state.defaultStatus;
                    if(nst.indexOf(st.value) > -1){
                      let i = nst.indexOf(st.value);
                      nst.splice(i, 1);
                    } else {
                      nst.push(st.value)
                    }
                    this.getStuff(nst, this.state.defaultCat, this.state.defaultOrder)
                  }} />
                })}
                <Dropdown.Divider />
                <Dropdown.Header icon='sort' content='Sorting from' />
                {this.orderedBy.map((ord, i) => {
                  return <Dropdown.Item icon={(this.state.defaultOrder === ord.value) ? 'check circle' : 'circle outline'} key={ord.key} content={ord.text} onClick={() => this.getStuff(this.state.defaultStatus, this.state.defaultCat, ord.value)} />
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Menu.Menu>
        </Menu>
        <div className="main-container">
          <Container text>
            {(!window.navigator.standalone) && <Message info>For a better experience, add this website to your homescreen</Message>}
          </Container>
          <List celled relaxed selection size="big">
            {Object.keys(this.state.stuff).map(key => {
              let disabled = (typeof this.state.stuff[key].disabled === 'undefined') ? false : this.state.stuff[key].disabled;
              return <List.Item key={key} style={(disabled)?{display:'none'}:{}} className="list-item">
                <List.Content floated='right'>
                  <Level level={parseInt(this.state.stuff[key].status)} onChange={(v) => this.editStuffStatus(key, v)} />
                </List.Content>
                <ListItemContent itemName={(typeof this.state.stuff[key].searchName !== 'undefined') ? this.state.stuff[key].searchName : this.state.stuff[key].name} longPressCallback={() => this.onLongPress(key)} onClick={() => {}} />
              </List.Item>
              }
            )}
          </List>
          <Confirm
            header='This is a large confirm'
            open={this.state.openDeleteConfirm}
            onCancel={() => this.deleteConfirm(false)}
            onConfirm={() => this.deleteConfirm(true)}
            size='mini'
          />
          <Button circular icon='add' size='large' color='teal' className="button-add" onClick={() => this.setState({ openModal: true })} />
          <Modal style={{width:'auto'}} open={this.state.openModal} dimmer="blurring">
            <Modal.Header>Add new Stuff</Modal.Header>
            <Modal.Content>
              <Input placeholder='Stuff name' onChange={(e, data) => this.setState({ newStuffName: data.value })} />
              {this.state.newStuffError && <Label basic color='red' pointing='left'>This already exists!</Label> }
              <Divider hidden />
              {/* <div>
                <Input list='cats' placeholder='Category' onChange={(e, data) => this.setState({ newCatName: data.value })} />
                <datalist id='cats'>
                  {this.state.stuffcats.map(cat => 
                    (cat.value !== 'all') && <option key={cat.value} value={cat.value}>{cat.value}</option>
                  )}
                </datalist>
                </div>
              <Divider hidden /> */}
              <Level level={this.state.newLevel} onChange={(v) => this.setState({newLevel: v})} />
            </Modal.Content>
            <Modal.Actions>
              <Button secondary onClick={() => this.setState({ openModal: false })}>
                Close
              </Button>
              <Button primary loading={this.state.newStuffLoading} disabled={(this.state.newStuffName.length < 1 || this.state.newLevel < 0)} onClick={() => this.addNewStuff()}>
                Add
              </Button>
            </Modal.Actions>
          </Modal>
        </div>
      </>;
      break;
      default:
        screen = <Container textAlign='center' className="main-container">
          {(!window.navigator.standalone) && <Message info>For a better experience, add this website to your homescreen</Message>}
          <Header size='large'>Coinquilini</Header>
          <Button color='google plus' onClick={() => {this.signInWithGoogle()}}>
            <Icon name='google plus' /> Login Coinquilini with Google
          </Button>
          {(this.state.loginError.length > 0) && <Message negative>{this.state.loginError}</Message>}
          
      </Container>;
      break;
    }

    return screen;
  }
}
