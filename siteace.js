Websites = new Mongo.Collection("websites");

Router.route('/detail/:_id', function() {
  this.render('detail', {
    data: function() {
      Meteor.subscribe("websites");
      var website = Websites.findOne({_id: this.params._id});
      if (website) {
        website.comments = website.comments.map(function(comment) {
          var user = Meteor.users.findOne({_id: comment.createdBy })
          return {
            'createdBy': user.emails[0].address,
            'content': comment.content,
            'createdOn': comment.createdOn
          };
        });
        return website;
      }
    }
  });
});

Router.route('/', {
  name: 'home',
  template: 'main'
});

Websites.allow({
  insert: function(userId, doc) {
    if (Meteor.user()) {
      if (userId != doc.createdBy) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  },
  remove: function(userId, doc) {
    if (Meteor.user()) {
      if (userId != doc.createdBy) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  },

  update: function(userId, doc) {
    if (Meteor.user()) {
      return true;
    } else {
      return false;
    }
  }
})


if (Meteor.isClient) {

  /////
  // template helpers 
  /////

  // helper function that returns all available websites
  Template.website_list.helpers({
    websites: function() {
      Meteor.subscribe("search", Session.get('search-query'));
      return Websites.find({}, {sort: {vote: -1}});
    }
  });

  Template.detail.helpers({
    websites: function() {
      Meteor.subscribe("websites");// Session.get('search-query'));
      return Websites.find({});
    }
  });

  /////
  // template events 
  /////

  Template.search.events({
    'keyup #search-input': function (event) {
      Session.set('search-query', $('[id=search-input]').val());
    }
  });

  Template.website_item.events({
    "click .js-upvote":function(event){
      Websites.update({_id: this._id}, {$inc: {vote: 1} });
      return false;// prevent the button from reloading the page
    }, 
    "click .js-downvote":function(event){
      Websites.update({_id: this._id}, {$inc: {vote: -1} });
      return false;// prevent the button from reloading the page
    }
  })

  Template.website_form.events({
    "click .js-toggle-website-form":function(event) {
      $("#website_form").toggle('slow');
    }, 
    "submit .js-save-website-form":function(event) {
      var url = $('[id=url]').val();
      extractMeta(url, function (err, res) {
        Websites.insert({
          title: res.title, 
          url: url, 
          description: res.description, 
          createdBy: Meteor.userId(),
          createdOn: new Date()
        });
      });

      return false;// stop the form submit from reloading the page
    }
  });

  Template.detail.events({
    'submit .comment-form': function(event) {
      event.preventDefault();
      Websites.update({_id: this._id}, {
        $push: {
          comments: {
            'content': $('[name=comment]').val(),
            'createdBy': Meteor.userId(),
            'createdOn': new Date()
          }
        }
      });

      $('.comment-form').modal('hide');
      return false;// stop the form submit from reloading the page
    }
  })

  Template.register.events({
    'submit .register-form': function (event) {
      event.preventDefault();
      Accounts.createUser({
        email: $('[name=register-email]').val(),
        password: $('[name=register-password]').val(),
      }, function(error) {
        if (error) {
          $('[name=register-form]').addClass('has-error')
        } else {
          $('[name=register-form]').removeClass('has-error')
          $('#register-modal').modal('hide');
        }
      });
    }
  });

  Template.login.events({
    'submit .login-form': function (event) {
      event.preventDefault();
      Meteor.loginWithPassword(
        { 'email': $('[name=login-email]').val() },
        $('[name=login-password]').val(),
        function (error) {
          if (error) {
            $('[name=login-form]').addClass('has-error')
          } else {
            $('[name=login-form]').removeClass('has-error')
            location.reload();
          }
        }
      );
    }
  });

  Template.navbar.events({
    'click .logout': function (event) {
      event.preventDefault();
      Meteor.logout(function() {
        location.reload();
      })
    }
  });

}


if (Meteor.isServer) {

  // build index
  Websites._ensureIndex({
    description: "text"
  });

  Meteor.publish('search', function(search) {
      if (search && search.length > 0) {
        return Websites.find({$text:{$search: search}});
      }
      
      return Websites.find({});
  });

  Meteor.publish('websites', function () {
    return Websites.find({});
  });

  Meteor.publish('site_detail', function() {
    return Websites.find({});
  });

  // start up function that creates entries in the Websites databases.
  Meteor.startup(function () {
    // code to run on server at startup
    if (!Websites.findOne()){
      Websites.insert({
          title:"Goldsmiths Computing Department", 
          url:"http://www.gold.ac.uk/computing/", 
          description:"This is where this course was developed.", 
          createdOn:new Date()
      });
      Websites.insert({
          title:"University of London", 
          url:"http://www.londoninternational.ac.uk/courses/undergraduate/goldsmiths/bsc-creative-computing-bsc-diploma-work-entry-route", 
          description:"University of London International Programme.", 
          createdOn:new Date()
      });
      Websites.insert({
          title:"Coursera", 
          url:"http://www.coursera.org", 
          description:"Universal access to the world’s best education.", 
          createdOn:new Date()
      });
      Websites.insert({
          title:"Google", 
          url:"http://www.google.com", 
          description:"Popular search engine.", 
          createdOn:new Date()
      });
    }
  });
}
