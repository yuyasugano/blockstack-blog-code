import React, { Component } from 'react';
import {
  isSignInPending,
  loadUserData,
  Person,
  getFile,
  putFile,
  lookupProfile
} from 'blockstack';

const avatarFallbackImage = 'https://s3.amazonaws.com/onename/avatar-placeholder.png';

export default class Profile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      person: {
        name() {
          return 'Anonymous';
        },
        avatarUrl() {
          return avatarFallbackImage;
        },
      },
      username: "",
      newPost: "",
      posts: [],
      postIndex: 0,
      isLoading: false 
    };
  }

  render() {
    const { handleSignOut } = this.props;
    const { person } = this.state;
    const { username } = this.state;

    return (
      !isSignInPending() && person ?
      <div className="container">
        <div className="row">
          <div className="col-md-offset-3 col-md-6">
            <div className="col-md-12">

              <div className="avatar-section">
                <img src={ person.avatarUrl() ? person.avatarUrl() : avatarFallbackImage } className="img-rounded avatar" id="avatar-image" />

                <div className="username">
                  <h1>
                    <span id="heading-name">{ person.name() ? person.name() : 'Nameless Person' }</span>
                  </h1>
                  <span>{username}</span>
                  {this.isLocal() &&
                    <span>
                      &nbsp;|&nbsp;
                      <a onClick={ handleSignOut.bind(this) }>(Logout)</a>
                    </span>
                  }
                </div>
              </div>
            </div>

            <div className="col-md-12 posts">
              { this.state.isLoading && <span>Loading...</span> }
              { this.state.posts.map((post) => (
                <div className="post" key={post.id}>
                  {post.text}
                </div>
                )
              )}
            </div>

            {this.isLocal() &&
              <div className="new-status">
                <div className="col-md-12">
                  <textarea className="input-status" value={this.state.newPost} onChange={e => this.handleNewPostChange(e)} placeholder="Enter a post" />
                </div>
                <div className="col-md-12 text-right">
                  <button className="btn btn-primary btn-lg" onClick={e => this.handleNewPostSubmit(e)}>Submit a post</button>
                </div>
              </div>
            }
          </div>
        </div>
      </div> : null
    );
  }

  componentWillMount() {
    this.setState({
      person: new Person(loadUserData().profile),
      username: loadUserData().username
    });
  }

  componentDidMount() {
    this.fetchData()
  }

  handleNewPostChange(event) {
    this.setState({newPost: event.target.value})
  }

  handleNewPostSubmit(event) {
    this.saveNewPost(this.state.newPost)
    this.setState({ newPost: "" })
  }

  saveNewPost(postText) {
    let posts = this.state.posts
    let post = {
      id: this.state.postIndex++,
      text: postText.trim(),
      created_at: Date.now()
    }

    posts.unshift(post)
    const options = { encrypt: false }
    putFile('posts.json', JSON.stringify(posts), options)
    .then(() => {
      this.setState({ posts: posts })
    })
  }

  fetchData() {
    this.setState({ isLoading: true })

    if (this.isLocal()) {
      const options = { decrypt: false }
      getFile('posts.json', options)
      .then((file) => {
        var posts = JSON.parse(file || '[]')
        this.setState({
          person: new Person(loadUserData().profile),
          username: loadUserData().username,
          postIndex: posts.length,
          posts: posts,
        })
      })
      .finally(() => {
        this.setState({ isLoading: false })
      })
    } else {
      const username = this.props.match.params.username

      lookupProfile(username)
      .then((profile) => {
        this.setState({
          person: new Person(profile),
          username: username
        })
      })
      .catch((error) => {
        console.log('could not fetch profile')
      })

      const options = { username: username, decrypt: false }
      getFile('posts.json', options)
      .then((file) => {
        var posts = JSON.parse(file || '[]')
        this.setState({
          postIndex: posts.length,
          posts: posts
        })
      })
      .catch((error) => {
        console.log('could not fetch the posts')
      })
      .finally(() => {
        this.setState({ isLoading: false })
      })
    }
  }

  isLocal() {
    return this.props.match.params.username ? false : true
  }
}

