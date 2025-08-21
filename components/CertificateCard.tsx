import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Certificate } from '../types/certificate';
import { VerifiedBadge } from './VerifiedBadge';

interface CertificateCardProps {
  certificate: Certificate;
  onPress?: () => void;
  index?: number;
}

export function CertificateCard({ certificate, onPress, index = 0 }: CertificateCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        type: 'timing',
        duration: 600,
        delay: index * 100 
      }}
      className="mb-4"
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={{ position:'relative', borderRadius:20, overflow:'hidden' }}>
          {/* Outer frame glow */}
          <View style={{ position:'absolute', inset:0, borderRadius:20, backgroundColor:'rgba(0,200,255,0.04)', opacity:0.3 }} />
          {/* Gradient frame ring */}
          <LinearGradient
            colors={['rgba(0,184,212,0.35)','rgba(0,184,212,0.05)','rgba(0,184,212,0.35)']}
            start={{ x:0, y:0 }}
            end={{ x:1, y:1 }}
            style={{ padding:1.2, borderRadius:20 }}
          >
            <View style={{ backgroundColor:'#0b141f', borderRadius:18, padding:16 }}>
              {/* Subtle internal radial sheen */}
              <LinearGradient
                colors={['rgba(0,184,212,0.10)','rgba(0,0,0,0)']}
                start={{ x:0.15, y:0.1 }}
                end={{ x:0.9, y:0.9 }}
                style={{ position:'absolute', inset:0, opacity:0.5 }}
              />
              {/* Animated shimmer line */}
              <MotiView
                from={{ translateX:-40, opacity:0 }}
                animate={{ translateX:220, opacity:0.12 }}
                transition={{ loop:true, repeatReverse:false, duration:4200, delay: 600, easing: Easing.linear }}
                style={{ position:'absolute', top:0, bottom:0, width:60, backgroundColor:'rgba(255,255,255,0.03)', transform:[{ skewX:'-15deg' }] }}
              />
              {/* Corner accents */}
              <View style={{ position:'absolute', top:0, left:0, width:18, height:18, borderTopLeftRadius:18, borderColor:'#0ad', borderTopWidth:1.2, borderLeftWidth:1.2, opacity:0.55 }} />
              <View style={{ position:'absolute', top:0, right:0, width:18, height:18, borderTopRightRadius:18, borderColor:'#0ad', borderTopWidth:1.2, borderRightWidth:1.2, opacity:0.35 }} />
              <View style={{ position:'absolute', bottom:0, left:0, width:18, height:18, borderBottomLeftRadius:18, borderColor:'#0ad', borderBottomWidth:1.2, borderLeftWidth:1.2, opacity:0.3 }} />
              <View style={{ position:'absolute', bottom:0, right:0, width:18, height:18, borderBottomRightRadius:18, borderColor:'#0ad', borderBottomWidth:1.2, borderRightWidth:1.2, opacity:0.5 }} />

              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
                <View style={{ flex:1, paddingRight:10 }}>
                  <Text style={{ color:'white', fontSize:16, fontWeight:'700', letterSpacing:0.4 }} numberOfLines={1}>
                    {certificate.title}
                  </Text>
                  <Text style={{ color:'#7fa1b8', fontSize:12, fontWeight:'500', marginTop:4 }} numberOfLines={1}>
                    {certificate.issuer}
                  </Text>
                  <Text style={{ color:'#496170', fontSize:11, marginTop:6 }}>
                    {new Date(certificate.dateIssued).toLocaleDateString()}
                  </Text>
                </View>
                <VerifiedBadge isVerified={certificate.isVerified} />
              </View>
              {certificate.description && (
                <Text style={{ color:'#c2d5df', fontSize:12, lineHeight:18, opacity:0.88 }} numberOfLines={3}>
                  {certificate.description}
                </Text>
              )}
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}